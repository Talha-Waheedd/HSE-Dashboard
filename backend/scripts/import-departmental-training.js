'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INPUT = process.argv[2] || 'C:/Users/PMLS/Downloads/Departmental Training Log YTD-June-2026.xlsx';
const USER_ID = process.env.PREVIEW_USER_ID || 'c7ec4de8-f2cd-457f-a6df-ae4530fe6b0c';
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalized = value => clean(value).toLowerCase();
const canonicalDepartment = value => ({
  hse: 'HSE', store: 'Stores', stores: 'Stores', prd: 'PRD', prj: 'Project', project: 'Project',
  qc: 'QC/FS/NPD', 'qc/npd/fs': 'QC/FS/NPD', 'qc/fs/npd': 'QC/FS/NPD', esd: 'ESD',
}[normalized(value)] || clean(value));
const column = ref => /[A-Z]+/.exec(ref)?.[0] || '';
const decode = value => String(value || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const excelDate = value => {
  const text = clean(value);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) { const [day, month, year] = text.split('/'); return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; }
  if (/^\d+(\.\d+)?$/.test(text)) { const date = new Date(Date.UTC(1899, 11, 30) + Number(text) * 86400000); return date.toISOString().slice(0, 10); }
  return null;
};
const classify = topic => {
  const value = normalized(topic);
  if (value.includes('induction')) return 'induction';
  if (value.includes('toolbox') || value === 'tbt' || value.includes(' tbt')) return 'toolbox_talk';
  if (value.includes('fire')) return 'fire_safety';
  if (value.includes('first aid')) return 'first_aid';
  if (value.includes('ppe')) return 'ppe_usage';
  if (value.includes('chemical')) return 'chemical_handling';
  if (value.includes('emergency') || value.includes('erp')) return 'emergency_response';
  if (value.includes('refresher')) return 'refresher';
  return 'other';
};
function filesFromXlsx(file) {
  const buffer = fs.readFileSync(file); let end = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) if (buffer.readUInt32LE(index) === 0x06054b50) { end = index; break; }
  if (end < 0) throw new Error('Invalid XLSX archive');
  const count = buffer.readUInt16LE(end + 10); let cursor = buffer.readUInt32LE(end + 16); const files = new Map();
  for (let index = 0; index < count; index += 1) {
    const method = buffer.readUInt16LE(cursor + 10), size = buffer.readUInt32LE(cursor + 20), nameLength = buffer.readUInt16LE(cursor + 28), extraLength = buffer.readUInt16LE(cursor + 30), commentLength = buffer.readUInt16LE(cursor + 32), local = buffer.readUInt32LE(cursor + 42), name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength), localNameLength = buffer.readUInt16LE(local + 26), localExtraLength = buffer.readUInt16LE(local + 28), start = local + 30 + localNameLength + localExtraLength, data = buffer.subarray(start, start + size);
    files.set(name, (method ? zlib.inflateRawSync(data) : data).toString('utf8')); cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}
function sourceRows(file) {
  const files = filesFromXlsx(file);
  const shared = [...(files.get('xl/sharedStrings.xml') || '').matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(match => [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(text => decode(text[1])).join(''));
  const relationships = files.get('xl/_rels/workbook.xml.rels') || '';
  const targets = new Map([...relationships.matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/>/g)].map(match => [match[1], `xl/${match[2].replace(/^\/?xl\//, '')}`]));
  const sheets = [...(files.get('xl/workbook.xml') || '').matchAll(/<sheet\b[^>]*\bname="([^"]+)"[^>]*\br:id="([^"]+)"[^>]*\/>/g)].map(match => ({ month: decode(match[1]), path: targets.get(match[2]) })).filter(sheet => /^(january|february|march|april|may|june)$/i.test(sheet.month));
  const rows = [];
  for (const sheet of sheets) {
    let department = '';
    for (const match of (files.get(sheet.path) || '').matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const values = {};
      for (const cell of match[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\br="([A-Z]+\d+)"/.exec(cell[1])?.[1]; if (!ref) continue;
        const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2] || '')?.[1] || '';
        values[column(ref)] = /\bt="s"/.test(cell[1]) ? (shared[Number(raw)] || '') : decode(raw);
      }
      if (clean(values.B)) department = clean(values.B);
      if (!clean(values.A) || normalized(values.A) === 'date') continue;
      rows.push({ sheet: sheet.month, row: Number(match[1]), department, date: clean(values.A), trainer: clean(values.C), venue: clean(values.D), topic: clean(values.E), participants: clean(values.F), duration: clean(values.G), manhours: clean(values.H) });
    }
  }
  return rows;
}
async function main() {
  const report = { source: INPUT, sheets: ['January', 'February', 'March', 'April', 'May', 'June'], sourceRows: 0, successful: 0, duplicates: 0, failed: 0, departmentsCreated: [], rows: [] };
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const source = sourceRows(INPUT); report.sourceRows = source.length;
  const [[plant]] = await db.query('SELECT id FROM plants WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1');
  if (!plant) throw new Error('No active plant is available for training import');
  const [departments] = await db.query('SELECT id, name FROM departments WHERE deleted_at IS NULL');
  const departmentMap = new Map(departments.map(row => [normalized(row.name), row.id]));
  const [fingerprints] = await db.query('SELECT source_fingerprint FROM training_sessions WHERE source_fingerprint IS NOT NULL');
  const known = new Set(fingerprints.map(row => row.source_fingerprint));
  await db.beginTransaction();
  try {
    for (const item of source) {
      const date = excelDate(item.date), participants = Number(item.participants), duration = Number(item.duration);
      if (!date || !item.department || !item.trainer || !item.topic || !Number.isFinite(participants) || participants <= 0 || !Number.isFinite(duration) || duration <= 0) {
        report.failed += 1; report.rows.push({ sheet: item.sheet, row: item.row, result: 'failed', reason: 'Missing or invalid date, department, trainer, topic, participants, or duration' }); continue;
      }
      const departmentName = canonicalDepartment(item.department);
      let departmentId = departmentMap.get(normalized(departmentName));
      if (!departmentId && normalized(departmentName) === 'hse') departmentId = departmentMap.get('hse department');
      if (!departmentId) {
        const [result] = await db.query('INSERT INTO departments (id, plant_id, name, code, is_active, created_by, updated_by, created_at, updated_at) VALUES (UUID(),?,?,?,?,?,?,NOW(),NOW())', [plant.id, departmentName, `IMP-${departmentName.replace(/[^A-Za-z0-9]/g, '').slice(0, 14).toUpperCase()}`, true, USER_ID, USER_ID]);
        const [[created]] = await db.query('SELECT id FROM departments WHERE id = LAST_INSERT_ID()');
        // UUID inserts do not expose LAST_INSERT_ID; resolve by normalized name instead.
        const [[resolved]] = await db.query('SELECT id FROM departments WHERE plant_id = ? AND name = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1', [plant.id, departmentName]);
        departmentId = resolved.id; departmentMap.set(normalized(departmentName), departmentId); report.departmentsCreated.push(departmentName);
      }
      const fingerprint = crypto.createHash('sha256').update([date, normalized(departmentName), normalized(item.trainer), normalized(item.venue), normalized(item.topic), participants, duration].join('|')).digest('hex');
      if (known.has(fingerprint)) { report.duplicates += 1; report.rows.push({ sheet: item.sheet, row: item.row, result: 'duplicate' }); continue; }
      const suppliedManhours = Number(item.manhours); const manhours = Number.isFinite(suppliedManhours) && suppliedManhours > 0 ? suppliedManhours : participants * duration / 60;
      await db.query('INSERT INTO training_sessions (id, plant_id, department_id, title, description, training_type, status, trainer_id, trainer_name, scheduled_date, duration_minutes, venue, max_attendees, participant_count, manhours, notes, source_fingerprint, created_by, updated_by, created_at, updated_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())', [plant.id, departmentId, item.topic.slice(0, 255), item.topic, classify(item.topic), 'completed', USER_ID, item.trainer.slice(0, 255), date, Math.round(duration), item.venue.slice(0, 255) || null, Math.round(participants), Math.round(participants), manhours.toFixed(2), `Imported from ${item.sheet} 2026 departmental training log`, fingerprint, USER_ID, USER_ID]);
      known.add(fingerprint); report.successful += 1; report.rows.push({ sheet: item.sheet, row: item.row, result: 'imported', date, department: departmentName, manhours: Number(manhours.toFixed(2)) });
    }
    await db.commit();
  } catch (error) { await db.rollback(); throw error; } finally { await db.end(); }
  const output = path.resolve(__dirname, '../import-reports/departmental-training-import.json'); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); console.log(JSON.stringify({ ...report, reportPath: output }, null, 2));
}
main().catch(error => { console.error(error); process.exit(1); });

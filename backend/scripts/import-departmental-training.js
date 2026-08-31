'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const INPUT = args.find(argument => !argument.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');
const sheetsArgument = args.find(argument => argument.startsWith('--sheets='));
const REQUESTED_SHEETS = sheetsArgument
  ? new Set(sheetsArgument.slice('--sheets='.length).split(',').map(value => value.trim().toLowerCase()).filter(Boolean))
  : null;
const sourceYears = path.basename(INPUT || '').match(/20\d{2}/g) || [];
const EXPECTED_YEAR = Number(sourceYears.at(-1)) || null;
const USER_ID = process.env.PREVIEW_USER_ID || 'c7ec4de8-f2cd-457f-a6df-ae4530fe6b0c';
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalized = value => clean(value).toLowerCase();
const canonicalDepartment = value => ({
  hse: 'HSE', store: 'Stores', stores: 'Stores', prd: 'PRD', prj: 'Projects', project: 'Projects', projects: 'Projects',
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
const sheetMonths = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
const dateForSheet = (value, sheet, expectedYear = null) => {
  const text = clean(value);
  const date = excelDate(text);
  const sheetMonth = sheetMonths[normalized(sheet)];
  if (!date && sheetMonth && expectedYear) {
    const parts = /^(\d{1,2})\/(\d{1,2})\/\d{4,5}$/.exec(text);
    const day = Number(parts?.[1]);
    const month = Number(parts?.[2]);
    if (parts && month === sheetMonth && day >= 1 && day <= 31) {
      return `${expectedYear}-${String(sheetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  if (!date || !sheetMonth) return date;
  const [parsedYear, parsedMonth, parsedDay] = date.split('-').map(Number);
  const year = expectedYear || parsedYear;
  if (parsedMonth === sheetMonth) {
    return `${year}-${String(sheetMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
  }

  // In the supplied departmental logs, dates entered as DD/MM/YYYY can be
  // stored by Excel as MM/DD/YYYY for days 1-12. The named worksheet is the
  // authoritative month, while the parsed month is the intended day.
  if (/^\d+(\.\d+)?$/.test(clean(value)) && parsedMonth >= 1 && parsedMonth <= 12) {
    return `${year}-${String(sheetMonth).padStart(2, '0')}-${String(parsedMonth).padStart(2, '0')}`;
  }
  return date;
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
  if (!INPUT) throw new Error('Usage: node scripts/import-departmental-training.js <workbook.xlsx> [--sheets=February,March] [--dry-run]');
  if (!fs.existsSync(INPUT)) throw new Error(`Training workbook not found: ${INPUT}`);
  const workbookRows = sourceRows(INPUT);
  const source = REQUESTED_SHEETS
    ? workbookRows.filter(item => REQUESTED_SHEETS.has(normalized(item.sheet)))
    : workbookRows;
  if (!source.length) throw new Error('No training rows matched the requested worksheet selection.');
  const report = {
    source: path.basename(INPUT),
    dryRun: DRY_RUN,
    expectedYear: EXPECTED_YEAR,
    sheets: [...new Set(source.map(item => item.sheet))],
    sourceRows: source.length,
    successful: 0,
    duplicates: 0,
    ignored: 0,
    failed: 0,
    warnings: 0,
    correctedDates: 0,
    departmentsCreated: [],
    rows: [],
  };
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const [[plant]] = await db.query('SELECT id FROM plants WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1');
  if (!plant) throw new Error('No active plant is available for training import');
  const [departments] = await db.query('SELECT id, name FROM departments WHERE plant_id = ? AND is_active = 1 AND deleted_at IS NULL', [plant.id]);
  const departmentMap = new Map(departments.map(row => [normalized(row.name), row.id]));
  const [fingerprints] = await db.query('SELECT source_fingerprint FROM training_sessions WHERE source_fingerprint IS NOT NULL');
  const known = new Set(fingerprints.map(row => row.source_fingerprint));
  const sourceOccurrences = new Map();
  await db.beginTransaction();
  try {
    for (const item of source) {
      const parsedDate = excelDate(item.date), date = dateForSheet(item.date, item.sheet, EXPECTED_YEAR), participants = Number(item.participants), duration = Number(item.duration);
      const hasRecordContent = [item.trainer, item.venue, item.topic, item.participants, item.duration, item.manhours].some(value => clean(value));
      if (!hasRecordContent) {
        report.ignored += 1;
        report.rows.push({ sheet: item.sheet, row: item.row, result: 'ignored', reason: 'Worksheet title or total row' });
        continue;
      }
      if (!date || !item.department || !item.trainer || !item.topic || !Number.isFinite(participants) || participants <= 0) {
        report.failed += 1; report.rows.push({ sheet: item.sheet, row: item.row, result: 'failed', reason: 'Missing or invalid date, department, trainer, topic, or participants' }); continue;
      }
      const hasDuration = Number.isFinite(duration) && duration > 0;
      if (!hasDuration) report.warnings += 1;
      if (date !== parsedDate) report.correctedDates += 1;
      const departmentName = canonicalDepartment(item.department);
      let departmentId = departmentMap.get(normalized(departmentName));
      if (!departmentId && normalized(departmentName) === 'hse') departmentId = departmentMap.get('hse department');
      if (!departmentId) {
        await db.query('INSERT INTO departments (id, plant_id, name, code, is_active, created_by, updated_by, created_at, updated_at) VALUES (UUID(),?,?,?,?,?,?,NOW(),NOW())', [plant.id, departmentName, `IMP-${departmentName.replace(/[^A-Za-z0-9]/g, '').slice(0, 14).toUpperCase()}`, true, USER_ID, USER_ID]);
        const [[resolved]] = await db.query('SELECT id FROM departments WHERE plant_id = ? AND name = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1', [plant.id, departmentName]);
        departmentId = resolved.id; departmentMap.set(normalized(departmentName), departmentId); report.departmentsCreated.push(departmentName);
      }
      const fingerprintSource = [date, normalized(departmentName), normalized(item.trainer), normalized(item.venue), normalized(item.topic), participants, hasDuration ? duration : 'missing-duration'].join('|');
      const occurrence = (sourceOccurrences.get(fingerprintSource) || 0) + 1;
      sourceOccurrences.set(fingerprintSource, occurrence);
      // Keep the first occurrence compatible with earlier imports. Repeated
      // source rows receive a stable occurrence suffix so no workbook row is
      // silently discarded and rerunning the same import remains idempotent.
      const fingerprintValue = occurrence === 1 ? fingerprintSource : `${fingerprintSource}|occurrence:${occurrence}`;
      const fingerprint = crypto.createHash('sha256').update(fingerprintValue).digest('hex');
      if (known.has(fingerprint)) { report.duplicates += 1; report.rows.push({ sheet: item.sheet, row: item.row, result: 'duplicate' }); continue; }
      const manhours = hasDuration ? (participants * duration) / 60 : null;
      const venue = String(item.venue || '').trim();
      await db.query('INSERT INTO training_sessions (id, plant_id, department_id, title, description, training_type, status, trainer_id, trainer_name, scheduled_date, duration_minutes, venue, max_attendees, participant_count, manhours, notes, source_fingerprint, created_by, updated_by, created_at, updated_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())', [plant.id, departmentId, item.topic.slice(0, 255), item.topic, classify(item.topic), 'completed', USER_ID, item.trainer.slice(0, 255), date, hasDuration ? Math.round(duration) : null, venue.slice(0, 255) || null, Math.round(participants), Math.round(participants), manhours === null ? null : manhours.toFixed(2), `Imported from ${item.sheet} ${EXPECTED_YEAR || date.slice(0, 4)} departmental training log${hasDuration ? '' : '; duration missing in source'}`, fingerprint, USER_ID, USER_ID]);
      known.add(fingerprint); report.successful += 1; report.rows.push({ sheet: item.sheet, row: item.row, result: DRY_RUN ? 'validated' : 'imported', date, sourceDate: parsedDate, dateCorrected: date !== parsedDate, sourceOccurrence: occurrence, department: departmentName, manhours: manhours === null ? null : Number(manhours.toFixed(2)), warning: hasDuration ? null : 'Duration missing in source; manhours left blank' });
    }
    if (DRY_RUN) await db.rollback(); else await db.commit();
  } catch (error) { await db.rollback(); throw error; } finally { await db.end(); }
  let reportPath = null;
  if (!DRY_RUN) {
    const reportName = `${path.basename(INPUT, path.extname(INPUT)).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}-import.json`;
    reportPath = path.resolve(__dirname, '../import-reports', reportName);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
  const { rows, ...summary } = report;
  console.log(JSON.stringify({ ...summary, issues: rows.filter(row => row.result === 'failed' || row.warning), reportPath }, null, 2));
}
if (require.main === module) {
  main().catch(error => { console.error(error); process.exit(1); });
}

module.exports = { sourceRows, excelDate, dateForSheet, canonicalDepartment, classify };

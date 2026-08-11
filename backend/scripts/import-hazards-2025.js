'use strict';

/* One-off, transaction-safe importer for the legacy Book1.xlsx hazard register. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INPUT = process.argv[2] || 'C:/Users/PMLS/Downloads/Book1.xlsx';
const PLANT_ID = '5126923e-b77f-4eb6-8b98-d5fc9db8d71b';
const SYSTEM_USER_EMAIL = 'superadmin@cblapp.com';
const DEPARTMENT_IDS = {
  HSE: '36d4db48-05df-4cec-8781-5ff52873718b',
  PRD: '2b8a3db9-a0b1-4244-a0b1-927f45285ec2',
};

const xmlDecode = (text) => String(text || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const readZipEntries = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error('Workbook is not a valid ZIP archive.');
  const count = buffer.readUInt16LE(eocd + 10);
  const directoryOffset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  let cursor = directoryOffset;
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid workbook central directory.');
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(start, start + compressedSize);
    const content = method === 0 ? compressed : zlib.inflateRawSync(compressed);
    entries.set(name, content.toString('utf8'));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

const parseSheet = (filePath) => {
  const entries = readZipEntries(filePath);
  const shared = [...(entries.get('xl/sharedStrings.xml') || '').matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)]
    .map((match) => [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((part) => xmlDecode(part[1])).join(''));
  const sheet = entries.get('xl/worksheets/sheet1.xml');
  if (!sheet) throw new Error('Workbook does not contain the first worksheet.');
  const rows = [];
  for (const rowMatch of sheet.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1]);
    if (rowNumber < 3) continue;
    const values = {};
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = cellMatch[1];
      const ref = /\br="([A-Z]+)\d+"/.exec(attributes)?.[1];
      if (!ref) continue;
      const body = cellMatch[2] || '';
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] || '';
      const value = /\bt="s"/.test(attributes) ? (shared[Number(raw)] || '') : xmlDecode(raw);
      values[ref] = value;
    }
    if (String(values.A || '').trim()) rows.push({ rowNumber, values });
  }
  return rows;
};

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const parseDate = (value) => {
  const text = clean(value);
  if (/^\d+(\.\d+)?$/.test(text)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Number(text) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day)
    ? date.toISOString().slice(0, 10) : null;
};

const categoryFromType = (value) => {
  const text = clean(value).toLowerCase();
  if (!text) return 'other';
  if (text.includes('fire') || text.includes('firefighting')) return 'fire';
  if (text.includes('electro') || text.includes('short circuit')) return 'electrical';
  if (text.includes('chemical')) return 'chemical';
  if (text.includes('unsafe') || text.includes('wah') || text.includes('person fall')) return 'behavioral';
  return 'physical';
};

const fingerprintFor = (row) => crypto.createHash('sha256').update([
  row.date, row.description, row.location, row.originatorName, row.originatedDepartment,
  row.responsibleDepartment, row.severity, row.sourceStatus, row.unsafe, row.remarks, row.type,
].map(clean).join('|')).digest('hex');

const normalizeRows = (sourceRows) => {
  const seen = new Set();
  const records = [];
  const report = { sourceRows: sourceRows.length, successful: 0, skipped: 0, duplicates: 0, alreadyImported: 0, failed: 0, warnings: 0, issues: [], duplicateRows: [] };
  for (const source of sourceRows) {
    const v = source.values;
    const row = {
      sourceRow: source.rowNumber,
      sNo: clean(v.A), date: parseDate(v.B), month: clean(v.C),
      originatedDepartment: clean(v.D), originatorName: clean(v.E), location: clean(v.F),
      description: clean(v.G), responsibleDepartment: clean(v.H), severity: clean(v.I).toLowerCase(),
      unsafe: clean(v.J), sourceStatus: clean(v.K), remarks: clean(v.L), type: clean(v.M),
    };
    const issues = [];
    if (!row.date || !row.date.startsWith('2025-')) issues.push('invalid_or_non_2025_date');
    if (!row.description) issues.push('missing_description');
    if (!['low', 'medium', 'high'].includes(row.severity)) issues.push('invalid_risk_rating');
    if (!['done', 'pending'].includes(row.sourceStatus.toLowerCase())) issues.push('invalid_status');
    if (!DEPARTMENT_IDS[row.originatedDepartment.toUpperCase()]) issues.push('unmapped_originated_department');
    if (!row.type) issues.push('missing_type_defaulted_to_other');
    const fingerprint = fingerprintFor(row);
    if (seen.has(fingerprint)) { report.duplicates += 1; report.duplicateRows.push({ sourceRow: source.rowNumber, row }); continue; }
    seen.add(fingerprint);
    if (issues.includes('invalid_or_non_2025_date') || issues.includes('missing_description') || issues.includes('invalid_risk_rating') || issues.includes('invalid_status')) {
      report.failed += 1;
      report.issues.push({ sourceRow: source.rowNumber, issues, row });
      continue;
    }
    row.fingerprint = fingerprint;
    row.issues = issues;
    records.push(row);
  }
  report.warnings = records.filter((row) => row.issues.length > 0).length;
  report.skipped = report.sourceRows - records.length - report.duplicates - report.failed;
  return { records, report };
};

async function main() {
  const { records, report } = normalizeRows(parseSheet(INPUT));
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  try {
    const [[user]] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [SYSTEM_USER_EMAIL]);
    if (!user) throw new Error(`Import user ${SYSTEM_USER_EMAIL} was not found.`);
    const [[plant]] = await connection.query('SELECT id FROM plants WHERE id = ? LIMIT 1', [PLANT_ID]);
    if (!plant) throw new Error(`Import plant ${PLANT_ID} was not found.`);
    const [existing] = await connection.query('SELECT description, location, severity_level, reported_at, metadata FROM hazards WHERE deleted_at IS NULL');
    const existingFingerprints = new Set();
    for (const item of existing) {
      let metadata = {};
      try { metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}); } catch (_) { metadata = {}; }
      if (metadata.importFingerprint) existingFingerprints.add(metadata.importFingerprint);
      if (metadata.importSource && Number(metadata.importYear) === 2025) {
        existingFingerprints.add(fingerprintFor({
          date: metadata.date, description: item.description, location: item.location,
          originatorName: metadata.originator_name, originatedDepartment: metadata.originated_department,
          responsibleDepartment: metadata.responsible_department, severity: item.severity_level,
          sourceStatus: metadata.pending, unsafe: metadata.unsafe_type, remarks: metadata.remarks, type: metadata.type,
        }));
      }
    }
    const toInsert = records.filter((row) => {
      if (existingFingerprints.has(row.fingerprint)) { report.alreadyImported += 1; return false; }
      return true;
    });
    await connection.beginTransaction();
    const sql = `INSERT INTO hazards
      (id, reported_by, plant_id, department_id, category, severity_level, title, description, location, status,
       reported_at, created_by, updated_by, metadata, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
    for (const row of toInsert) {
      const departmentId = DEPARTMENT_IDS[row.originatedDepartment.toUpperCase()] || null;
      const status = row.sourceStatus.toLowerCase() === 'done' ? 'resolved' : 'under_review';
      const metadata = {
        importSource: path.basename(INPUT), importYear: 2025, importFingerprint: row.fingerprint,
        sourceRow: row.sourceRow, s_no: row.sNo, date: row.date, month: row.month,
        department_id: departmentId || row.originatedDepartment, originated_department: row.originatedDepartment,
        originator: row.originatorName, originator_name: row.originatorName,
        responsible_department: row.responsibleDepartment, resp: row.responsibleDepartment,
        unsafe_type: row.unsafe, pending: row.sourceStatus, remarks: row.remarks, type: row.type,
        importIssues: row.issues,
      };
      await connection.execute(sql, [
        crypto.randomUUID(), user.id, PLANT_ID, departmentId, categoryFromType(row.type), row.severity,
        row.description.slice(0, 255) || 'Imported Hazard Report', row.description, row.location || null, status,
        `${row.date} 00:00:00`, user.id, user.id, JSON.stringify(metadata),
      ]);
      report.successful += 1;
    }
    await connection.commit();
    const [[activeImported]] = await connection.query("SELECT COUNT(*) AS count FROM hazards WHERE deleted_at IS NULL AND JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.importYear'))='2025'");
    report.remainingDatabaseRows = report.successful;
    report.activeImported = Number(activeImported.count);
    report.totalImported = report.activeImported;
    const reportPath = path.resolve(__dirname, '../import-reports/hazard-import-2025.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({ ...report, importedRows: report.successful, generatedAt: new Date().toISOString() }, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    try { await connection.rollback(); } catch (_) { /* preserve original error */ }
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) main().catch((error) => { console.error(error.stack || error.message || error); process.exitCode = 1; });

module.exports = { parseSheet, normalizeRows, fingerprintFor };

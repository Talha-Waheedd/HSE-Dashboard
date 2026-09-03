'use strict';

const path = require('path');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/database/connection');
const Hazard = require('../src/modules/hazards/hazard.model');

const clean = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const keyText = (value) => clean(value).toLowerCase();
const encodingTolerantKey = (value) => keyText(value).normalize('NFKD')
  .replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim();
const headerKey = (value) => keyText(value).replace(/[^a-z0-9]/g, '');

const cellValue = (cell) => {
  const value = cell?.value;
  if (value instanceof Date) return value;
  if (value && typeof value === 'object') {
    if (value.result !== undefined) return value.result;
    if (value.text !== undefined) return value.text;
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
  }
  return value;
};

const isoDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return isoDate(date);
  }
  const text = clean(value);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const pakistan = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (!pakistan) return '';
  return `${pakistan[3]}-${pakistan[2].padStart(2, '0')}-${pakistan[1].padStart(2, '0')}`;
};

const findHeader = (worksheet) => {
  for (let rowNumber = 1; rowNumber <= Math.min(15, worksheet.actualRowCount); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const headers = new Map();
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      headers.set(headerKey(cellValue(cell)), columnNumber);
    });
    const descriptionColumn = headers.get('hazardsdescription') || headers.get('hazarddescription');
    const statusColumn = headers.get('pending') || headers.get('status');
    if (descriptionColumn && statusColumn) return { rowNumber, headers, descriptionColumn, statusColumn };
  }
  return null;
};

const valueFrom = (row, headers, names) => {
  const column = names.map((name) => headers.get(headerKey(name))).find(Boolean);
  return column ? cellValue(row.getCell(column)) : '';
};

const businessKey = (record) => [
  record.date,
  record.originatedDepartment,
  record.originatorName,
  record.location,
  record.description,
  record.responsibleDepartment,
  record.riskRating,
  record.unsafeType,
  record.remarks,
].map(keyText).join('|');

const legacyFingerprint = (record) => crypto.createHash('sha256').update([
  record.date,
  record.description,
  record.location,
  record.originatorName,
  record.originatedDepartment,
  record.responsibleDepartment,
  record.riskRating,
  record.sourceStatus,
  record.unsafeType,
  record.remarks,
  record.type,
].map(clean).join('|')).digest('hex');

const parseWorkbook = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const inventory = [];
  const candidates = [];

  for (const worksheet of workbook.worksheets) {
    const header = findHeader(worksheet);
    const sheet = {
      name: worksheet.name,
      state: worksheet.state,
      rows: worksheet.actualRowCount,
      columns: worksheet.actualColumnCount,
      mergedRanges: Object.keys(worksheet._merges || {}).length,
      classification: header ? 'hazard-record-sheet' : 'non-hazard-sheet',
      headerRow: header?.rowNumber || null,
      statusHeader: header ? clean(cellValue(worksheet.getRow(header.rowNumber).getCell(header.statusColumn))) : null,
      candidateRows: 0,
      statusCounts: {},
    };

    if (header && /hazard spotting/i.test(worksheet.name)) {
      for (let rowNumber = header.rowNumber + 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const description = clean(valueFrom(row, header.headers, ['Hazards Description', 'Hazard Description']));
        if (!description) continue;
        const sourceStatus = clean(valueFrom(row, header.headers, ['Pending', 'Status']));
        const record = {
          workbook: path.basename(filePath),
          sheet: worksheet.name,
          sourceRow: rowNumber,
          serial: clean(valueFrom(row, header.headers, ['S#', 'S.No', 'Serial'])),
          date: isoDate(valueFrom(row, header.headers, ['Date'])),
          originatedDepartment: clean(valueFrom(row, header.headers, ['Originated Deptt.', 'Originated Department'])),
          originatorName: clean(valueFrom(row, header.headers, ['Originator Name'])),
          location: clean(valueFrom(row, header.headers, ['Location'])),
          description,
          responsibleDepartment: clean(valueFrom(row, header.headers, ['RESP.', 'Responsible Department'])),
          riskRating: clean(valueFrom(row, header.headers, ['Risk Rating'])).toLowerCase(),
          unsafeType: clean(valueFrom(row, header.headers, ['Unsafe'])),
          sourceStatus,
          remarks: clean(valueFrom(row, header.headers, ['Remarks'])),
          type: clean(valueFrom(row, header.headers, ['type', 'Hazard Category'])),
        };
        record.businessKey = businessKey(record);
        record.legacyFingerprint = legacyFingerprint(record);
        candidates.push(record);
        sheet.candidateRows += 1;
        const statusKey = sourceStatus || '<blank>';
        sheet.statusCounts[statusKey] = (sheet.statusCounts[statusKey] || 0) + 1;
      }
    }
    inventory.push(sheet);
  }
  return { inventory, candidates };
};

const metadataValue = (metadata, ...keys) => {
  for (const key of keys) {
    if (metadata?.[key] !== undefined && metadata[key] !== null) return metadata[key];
  }
  return '';
};

const databaseRecord = (hazard) => {
  const metadata = hazard.metadata || {};
  const record = {
    date: isoDate(metadataValue(metadata, 'date') || hazard.reportedAt),
    originatedDepartment: clean(metadataValue(metadata, 'originated_department', 'originated_dept', 'department_name')),
    originatorName: clean(metadataValue(metadata, 'originator_name', 'originator')),
    location: clean(hazard.location || metadataValue(metadata, 'location_name')),
    description: clean(hazard.description),
    responsibleDepartment: clean(metadataValue(metadata, 'responsible_department', 'responsible', 'resp')),
    riskRating: clean(hazard.severityLevel).toLowerCase(),
    unsafeType: clean(metadataValue(metadata, 'unsafe_type')),
    remarks: clean(metadataValue(metadata, 'remarks')),
  };
  return {
    id: hazard.id,
    status: hazard.status,
    date: record.date,
    serial: clean(metadataValue(metadata, 's_no')),
    description: record.description,
    businessRecord: record,
    businessKey: businessKey(record),
    importFingerprint: clean(metadataValue(metadata, 'importFingerprint')),
    importSource: clean(metadataValue(metadata, 'importSource')),
    importYear: clean(metadataValue(metadata, 'importYear')),
    sourceStatus: clean(metadataValue(metadata, 'pending', 'status_csv')),
    legacyImportShape: Object.prototype.hasOwnProperty.call(metadata, 's_no')
      && Object.prototype.hasOwnProperty.call(metadata, 'originator')
      && Object.prototype.hasOwnProperty.call(metadata, 'originated_dept')
      && Object.prototype.hasOwnProperty.call(metadata, 'responsible')
      && Object.prototype.hasOwnProperty.call(metadata, 'unsafe_type'),
    legacyCohort: Object.prototype.hasOwnProperty.call(metadata, 'status_csv')
      && Object.prototype.hasOwnProperty.call(metadata, 'hazard_category')
      ? 'Hazard Spotting 2026'
      : Object.prototype.hasOwnProperty.call(metadata, 's_no')
        && Object.prototype.hasOwnProperty.call(metadata, 'originated_dept')
        && Object.prototype.hasOwnProperty.call(metadata, 'responsible')
        && Object.prototype.hasOwnProperty.call(metadata, 'unsafe_type')
        ? 'Hazard Spotting 2025'
        : '',
    metadataSignature: Object.keys(metadata).sort().join(','),
  };
};

const countBy = (values, selector) => values.reduce((counts, value) => {
  const key = selector(value) || '<blank>';
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const main = async () => {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node scripts/inspect-hazard-status-source.js <workbook.xlsx>');
  const { inventory, candidates } = await parseWorkbook(input);
  await sequelize.authenticate();
  const hazards = await Hazard.findAll({
    attributes: ['id', 'status', 'severityLevel', 'description', 'location', 'reportedAt', 'metadata'],
    paranoid: false,
  });
  const database = hazards.map(databaseRecord);
  const byBusinessKey = new Map();
  const byFingerprint = new Map();
  const byYearSerial = new Map();
  const byCohortSerial = new Map();
  for (const record of database) {
    if (!byBusinessKey.has(record.businessKey)) byBusinessKey.set(record.businessKey, []);
    byBusinessKey.get(record.businessKey).push(record);
    if (record.importFingerprint) byFingerprint.set(record.importFingerprint, record);
    const yearSerial = record.date && record.serial ? `${record.date.slice(0, 4)}|${record.serial}` : '';
    if (yearSerial) {
      if (!byYearSerial.has(yearSerial)) byYearSerial.set(yearSerial, []);
      byYearSerial.get(yearSerial).push(record);
    }
    const cohortSerial = record.legacyCohort && record.serial
      ? `${record.legacyCohort}|${record.serial}` : '';
    if (cohortSerial) {
      if (!byCohortSerial.has(cohortSerial)) byCohortSerial.set(cohortSerial, []);
      byCohortSerial.get(cohortSerial).push(record);
    }
  }

  const seen = new Set();
  let duplicateExcelRows = 0;
  let matched = 0;
  let unmatched = 0;
  let ambiguousMatches = 0;
  let updatesRequired = 0;
  let uniqueYearSerialMatches = 0;
  let exactYearSerialDescriptionMatches = 0;
  let ambiguousYearSerialMatches = 0;
  let missingYearSerialMatches = 0;
  const yearSerialMismatches = [];
  let uniqueCohortSerialMatches = 0;
  let exactCohortSerialDescriptionMatches = 0;
  let ambiguousCohortSerialMatches = 0;
  let missingCohortSerialMatches = 0;
  const cohortSerialMismatches = [];
  const cohortFieldMismatchCounts = {};
  const desiredStatusCounts = {};
  for (const candidate of candidates) {
    if (seen.has(candidate.businessKey)) duplicateExcelRows += 1;
    else seen.add(candidate.businessKey);
    const direct = byFingerprint.get(candidate.legacyFingerprint);
    const matches = direct ? [direct] : (byBusinessKey.get(candidate.businessKey) || []);
    if (matches.length === 1) {
      matched += 1;
      const desired = keyText(candidate.sourceStatus) === 'done' ? 'closed'
        : keyText(candidate.sourceStatus) === 'pending' ? 'under_review' : null;
      desiredStatusCounts[desired || '<unchanged>'] = (desiredStatusCounts[desired || '<unchanged>'] || 0) + 1;
      if (desired && matches[0].status !== desired) updatesRequired += 1;
    } else if (matches.length > 1) ambiguousMatches += 1;
    else unmatched += 1;

    const yearSerial = candidate.date && candidate.serial
      ? `${candidate.date.slice(0, 4)}|${candidate.serial}` : '';
    const serialMatches = yearSerial ? (byYearSerial.get(yearSerial) || []) : [];
    if (serialMatches.length === 1) {
      uniqueYearSerialMatches += 1;
      if (keyText(serialMatches[0].description) === keyText(candidate.description)) {
        exactYearSerialDescriptionMatches += 1;
      } else if (yearSerialMismatches.length < 20) {
        yearSerialMismatches.push({
          sheet: candidate.sheet,
          sourceRow: candidate.sourceRow,
          serial: candidate.serial,
          date: candidate.date,
          sourceDescription: candidate.description.slice(0, 160),
          databaseDescription: serialMatches[0].description.slice(0, 160),
        });
      }
    } else if (serialMatches.length > 1) ambiguousYearSerialMatches += 1;
    else missingYearSerialMatches += 1;

    const cohortSerial = `${candidate.sheet}|${candidate.serial}`;
    const cohortMatches = byCohortSerial.get(cohortSerial) || [];
    if (cohortMatches.length === 1) {
      uniqueCohortSerialMatches += 1;
      if (encodingTolerantKey(cohortMatches[0].description) === encodingTolerantKey(candidate.description)) {
        exactCohortSerialDescriptionMatches += 1;
      } else if (cohortSerialMismatches.length < 20) {
        cohortSerialMismatches.push({
          sheet: candidate.sheet,
          sourceRow: candidate.sourceRow,
          serial: candidate.serial,
          sourceDescription: candidate.description.slice(0, 160),
          databaseDescription: cohortMatches[0].description.slice(0, 160),
        });
      }
      const comparableFields = [
        'originatedDepartment', 'originatorName', 'location', 'description',
        'responsibleDepartment', 'riskRating', 'unsafeType', 'remarks',
      ];
      for (const field of comparableFields) {
        if (encodingTolerantKey(cohortMatches[0].businessRecord[field])
          !== encodingTolerantKey(candidate[field])) {
          cohortFieldMismatchCounts[field] = (cohortFieldMismatchCounts[field] || 0) + 1;
        }
      }
    } else if (cohortMatches.length > 1) ambiguousCohortSerialMatches += 1;
    else missingCohortSerialMatches += 1;
  }

  console.log(JSON.stringify({
    workbook: path.basename(input),
    worksheets: inventory,
    source: {
      totalCandidates: candidates.length,
      uniqueBusinessKeys: seen.size,
      duplicateExcelRows,
      statusCounts: countBy(candidates, (record) => record.sourceStatus),
    },
    database: {
      totalRowsIncludingDeleted: database.length,
      statusCounts: countBy(database, (record) => record.status),
      importSources: countBy(database, (record) => `${record.importSource || '<none>'}|${record.importYear || '<none>'}`),
      yearCounts: countBy(database, (record) => record.date.slice(0, 4)),
      legacyImportShapeRows: database.filter((record) => record.legacyImportShape).length,
      metadataSignatures: countBy(database, (record) => record.metadataSignature),
      legacyCohorts: countBy(database, (record) => record.legacyCohort),
    },
    reconciliation: {
      matched,
      unmatched,
      ambiguousMatches,
      updatesRequired,
      desiredStatusCounts,
      uniqueYearSerialMatches,
      exactYearSerialDescriptionMatches,
      ambiguousYearSerialMatches,
      missingYearSerialMatches,
      yearSerialMismatches,
      uniqueCohortSerialMatches,
      exactCohortSerialDescriptionMatches,
      ambiguousCohortSerialMatches,
      missingCohortSerialMatches,
      cohortSerialMismatches,
      cohortFieldMismatchCounts,
    },
  }, null, 2));
  await sequelize.close();
};

main().catch(async (error) => {
  console.error(error);
  try { await sequelize.close(); } catch (_) { /* noop */ }
  process.exit(1);
});

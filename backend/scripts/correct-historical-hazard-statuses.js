'use strict';

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const dotenv = require('dotenv');
const { QueryTypes } = require('sequelize');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/database/connection');
const Hazard = require('../src/modules/hazards/hazard.model');

const DEFAULT_INPUT = 'C:/Users/talha/OneDrive/Desktop/submissionofprojectactionplanhsemanagementinformati/Hazard Log Sheet YTD-June-2026.xlsx';
const DEFAULT_REPORT = path.resolve(__dirname, '../import-reports/hazard-status-correction.json');
const HAZARD_SHEETS = new Set(['Hazard Spotting 2025', 'Hazard Spotting 2026']);

const clean = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const normalized = (value) => clean(value).toLowerCase();
const headerKey = (value) => normalized(value).replace(/[^a-z0-9]/g, '');
const comparisonKey = (value) => normalized(value).normalize('NFKD').replace(/[^a-z0-9]/g, '');

const isoDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    return isoDate(new Date(Date.UTC(1899, 11, 30) + value * 86400000));
  }
  const text = clean(value);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const pakistan = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  return pakistan
    ? `${pakistan[3]}-${pakistan[2].padStart(2, '0')}-${pakistan[1].padStart(2, '0')}`
    : '';
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const valueAfter = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const positional = args.find((value, index) => !value.startsWith('--')
    && (index === 0 || !args[index - 1].startsWith('--')));
  return {
    input: path.resolve(valueAfter('--input') || positional || DEFAULT_INPUT),
    report: path.resolve(valueAfter('--report') || DEFAULT_REPORT),
    commit: args.includes('--commit'),
  };
};

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

const findHeader = (worksheet) => {
  for (let rowNumber = 1; rowNumber <= Math.min(15, worksheet.actualRowCount); rowNumber += 1) {
    const headers = new Map();
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      headers.set(headerKey(cellValue(cell)), columnNumber);
    });
    const descriptionColumn = headers.get('hazardsdescription') || headers.get('hazarddescription');
    const statusColumn = headers.get('pending') || headers.get('status');
    if (descriptionColumn && statusColumn) {
      return { rowNumber, headers, descriptionColumn, statusColumn };
    }
  }
  return null;
};

const valueFrom = (row, headers, names) => {
  const column = names.map((name) => headers.get(headerKey(name))).find(Boolean);
  return column ? cellValue(row.getCell(column)) : '';
};

const desiredStatus = (sourceStatus) => {
  const key = headerKey(sourceStatus);
  if (key === 'done') return 'closed';
  if (['pending', 'wip', 'workinprogress'].includes(key)) return 'under_review';
  return null;
};

const canonicalSourceStatus = (sourceStatus) => {
  const key = headerKey(sourceStatus);
  if (key === 'done') return 'Done';
  if (key === 'pending') return 'Pending';
  if (['wip', 'workinprogress'].includes(key)) return 'WIP';
  return clean(sourceStatus);
};

const businessFields = (values) => ({
  originatedDepartment: clean(values.originatedDepartment),
  originatorName: clean(values.originatorName),
  location: clean(values.location),
  description: clean(values.description),
  responsibleDepartment: clean(values.responsibleDepartment),
  riskRating: clean(values.riskRating).toLowerCase(),
  unsafeType: clean(values.unsafeType),
  remarks: clean(values.remarks),
});

const businessKey = (record) => Object.values(businessFields(record)).map(comparisonKey).join('|');

const parseWorkbook = async (input) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(input);
  const inventory = [];
  const candidates = [];

  for (const worksheet of workbook.worksheets) {
    const header = findHeader(worksheet);
    const isCanonicalHazardSheet = Boolean(header && HAZARD_SHEETS.has(worksheet.name));
    const sheetReport = {
      name: worksheet.name,
      state: worksheet.state,
      rows: worksheet.actualRowCount,
      columns: worksheet.actualColumnCount,
      classification: isCanonicalHazardSheet
        ? 'canonical-hazard-record-sheet'
        : header ? 'noncanonical-hazard-data' : 'different-module-or-subset',
      headerRow: header?.rowNumber || null,
      statusHeader: header
        ? clean(cellValue(worksheet.getRow(header.rowNumber).getCell(header.statusColumn)))
        : null,
      candidateRows: 0,
      statusCounts: {},
    };

    if (isCanonicalHazardSheet) {
      const seenSerials = new Set();
      for (let rowNumber = header.rowNumber + 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);
        const description = clean(valueFrom(row, header.headers, ['Hazards Description', 'Hazard Description']));
        if (!description) continue;
        const serial = clean(valueFrom(row, header.headers, ['S#', 'S.No', 'Serial']));
        const sourceStatus = clean(valueFrom(row, header.headers, ['Pending', 'Status']));
        const record = {
          sheet: worksheet.name,
          sourceRow: rowNumber,
          serial,
          sourceStatus,
          sourceStatusCanonical: canonicalSourceStatus(sourceStatus),
          desiredStatus: desiredStatus(sourceStatus),
          statusHeader: sheetReport.statusHeader,
          date: isoDate(valueFrom(row, header.headers, ['Date'])),
          ...businessFields({
            originatedDepartment: valueFrom(row, header.headers, ['Originated Deptt.', 'Originated Department']),
            originatorName: valueFrom(row, header.headers, ['Originator Name']),
            location: valueFrom(row, header.headers, ['Location']),
            description,
            responsibleDepartment: valueFrom(row, header.headers, ['RESP.', 'Responsible Department']),
            riskRating: valueFrom(row, header.headers, ['Risk Rating']),
            unsafeType: valueFrom(row, header.headers, ['Unsafe']),
            remarks: valueFrom(row, header.headers, ['Remarks']),
          }),
        };
        record.businessKey = businessKey(record);
        record.duplicateBusinessKey = `${record.date}|${record.businessKey}`;
        record.duplicateSerial = seenSerials.has(serial);
        seenSerials.add(serial);
        candidates.push(record);
        sheetReport.candidateRows += 1;
        const statusLabel = sourceStatus || '<blank>';
        sheetReport.statusCounts[statusLabel] = (sheetReport.statusCounts[statusLabel] || 0) + 1;
      }
    }
    inventory.push(sheetReport);
  }
  return { inventory, candidates };
};

const metadataValue = (metadata, ...keys) => {
  for (const key of keys) {
    if (metadata?.[key] !== undefined && metadata[key] !== null) return metadata[key];
  }
  return '';
};

const legacyCohort = (metadata) => {
  if (Object.prototype.hasOwnProperty.call(metadata, 'status_csv')
    && Object.prototype.hasOwnProperty.call(metadata, 'hazard_category')) {
    return 'Hazard Spotting 2026';
  }
  if (Object.prototype.hasOwnProperty.call(metadata, 's_no')
    && Object.prototype.hasOwnProperty.call(metadata, 'originator')
    && Object.prototype.hasOwnProperty.call(metadata, 'originated_dept')
    && Object.prototype.hasOwnProperty.call(metadata, 'responsible')
    && Object.prototype.hasOwnProperty.call(metadata, 'unsafe_type')
    && Object.prototype.hasOwnProperty.call(metadata, 'type')) {
    return 'Hazard Spotting 2025';
  }
  return '';
};

const databaseRecord = (hazard) => {
  const metadata = hazard.metadata || {};
  const record = businessFields({
    originatedDepartment: metadataValue(metadata, 'originated_department', 'originated_dept'),
    originatorName: metadataValue(metadata, 'originator_name', 'originator'),
    location: hazard.location || metadataValue(metadata, 'location_name'),
    description: hazard.description,
    responsibleDepartment: metadataValue(metadata, 'responsible_department', 'responsible', 'resp'),
    riskRating: hazard.severityLevel,
    unsafeType: metadataValue(metadata, 'unsafe_type'),
    remarks: metadataValue(metadata, 'remarks'),
  });
  return {
    id: hazard.id,
    status: hazard.status,
    metadata,
    serial: clean(metadataValue(metadata, 's_no')),
    cohort: legacyCohort(metadata),
    businessKey: businessKey(record),
    deletedAt: hazard.deletedAt,
  };
};

const countBy = (values, selector) => values.reduce((counts, value) => {
  const key = selector(value) || '<blank>';
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const chunksOf = (values, size) => Array.from(
  { length: Math.ceil(values.length / size) },
  (_, index) => values.slice(index * size, (index + 1) * size),
);

const updateGroup = async (group, inputName, transaction) => {
  let affected = 0;
  for (const ids of chunksOf(group.ids, 500)) {
    const result = await sequelize.query(`
      UPDATE hazards
      SET status = :status,
          metadata = JSON_SET(
            COALESCE(metadata, JSON_OBJECT()),
            '$.hazard_status_source_column', :sourceColumn,
            '$.hazard_status_source_value', :sourceValue,
            '$.hazard_status_source_sheet', :sourceSheet,
            '$.hazard_status_correction_source', :sourceWorkbook
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE id IN (:ids)
    `, {
      replacements: {
        status: group.status,
        sourceColumn: group.sourceColumn,
        sourceValue: group.sourceValue,
        sourceSheet: group.sheet,
        sourceWorkbook: inputName,
        ids,
      },
      type: QueryTypes.UPDATE,
      transaction,
    });
    affected += Number(Array.isArray(result) ? result[1] : result) || ids.length;
  }
  return affected;
};

const main = async () => {
  const args = parseArgs();
  if (!fs.existsSync(args.input)) throw new Error(`Workbook not found: ${args.input}`);
  const inputName = path.basename(args.input);
  const { inventory, candidates } = await parseWorkbook(args.input);
  await sequelize.authenticate();

  const hazards = await Hazard.findAll({
    attributes: ['id', 'status', 'severityLevel', 'description', 'location', 'metadata', 'deletedAt'],
    paranoid: false,
  });
  const database = hazards.map(databaseRecord);
  const byCohortSerial = new Map();
  for (const record of database) {
    const key = record.cohort && record.serial ? `${record.cohort}|${record.serial}` : '';
    if (!key) continue;
    if (!byCohortSerial.has(key)) byCohortSerial.set(key, []);
    byCohortSerial.get(key).push(record);
  }

  const sourceSerials = new Set();
  const sourceBusinessKeys = new Set();
  const updates = [];
  const alreadyCorrect = [];
  const unknownStatuses = [];
  const unmatched = [];
  const ambiguous = [];
  const fieldMismatches = [];
  let duplicateSerialRows = 0;
  let duplicateBusinessRows = 0;

  for (const candidate of candidates) {
    const serialKey = `${candidate.sheet}|${candidate.serial}`;
    if (sourceSerials.has(serialKey)) duplicateSerialRows += 1;
    else sourceSerials.add(serialKey);
    if (sourceBusinessKeys.has(candidate.duplicateBusinessKey)) duplicateBusinessRows += 1;
    else sourceBusinessKeys.add(candidate.duplicateBusinessKey);

    if (!candidate.desiredStatus) {
      unknownStatuses.push(candidate);
      continue;
    }
    const matches = byCohortSerial.get(serialKey) || [];
    if (matches.length === 0) {
      unmatched.push(candidate);
      continue;
    }
    if (matches.length > 1) {
      ambiguous.push({ candidate, ids: matches.map((match) => match.id) });
      continue;
    }
    const match = matches[0];
    if (match.businessKey !== candidate.businessKey) {
      fieldMismatches.push({ candidate, id: match.id });
      continue;
    }
    const resolved = { candidate, match };
    if (match.status === candidate.desiredStatus) alreadyCorrect.push(resolved);
    else updates.push(resolved);
  }

  const activeBefore = await Hazard.count();
  const statusBefore = countBy(database.filter((record) => !record.deletedAt), (record) => record.status);
  const groups = new Map();
  for (const update of updates) {
    const groupKey = [
      update.candidate.sheet,
      update.candidate.sourceStatusCanonical,
      update.candidate.desiredStatus,
      update.candidate.statusHeader,
    ].join('|');
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        sheet: update.candidate.sheet,
        sourceValue: update.candidate.sourceStatusCanonical,
        status: update.candidate.desiredStatus,
        sourceColumn: update.candidate.statusHeader,
        ids: [],
      });
    }
    groups.get(groupKey).ids.push(update.match.id);
  }

  let updated = 0;
  if (args.commit) {
    if (ambiguous.length || fieldMismatches.length) {
      throw new Error(`Unsafe match set: ${ambiguous.length} ambiguous, ${fieldMismatches.length} field mismatches`);
    }
    await sequelize.transaction(async (transaction) => {
      for (const group of groups.values()) {
        updated += await updateGroup(group, inputName, transaction);
      }
    });
  }

  const activeAfter = await Hazard.count();
  const statusRowsAfter = await Hazard.findAll({ attributes: ['status'], raw: true });
  const report = {
    mode: args.commit ? 'commit' : 'dry-run',
    generatedAt: new Date().toISOString(),
    workbook: inputName,
    worksheets: inventory,
    mapping: {
      sourceColumnAccepted: ['Pending', 'Status'],
      Done: 'closed',
      Pending: 'under_review',
      WIP: 'under_review',
      uiLabels: { closed: 'Closed', under_review: 'Pending' },
    },
    source: {
      totalHazardRows: candidates.length,
      statusCounts: countBy(candidates, (candidate) => candidate.sourceStatusCanonical),
      blankOrUnknownStatuses: unknownStatuses.length,
      duplicateSerialRows,
      duplicateBusinessRows,
    },
    reconciliation: {
      existingRecordsMatched: updates.length + alreadyCorrect.length,
      recordsRequiringUpdate: updates.length,
      recordsAlreadyCorrect: alreadyCorrect.length,
      ambiguousMatches: ambiguous.length,
      fieldMismatches: fieldMismatches.length,
      genuinelyNewCandidates: unmatched.length,
      recordsInserted: 0,
      recordsUpdated: args.commit ? updated : 0,
      activeHazardsBefore: activeBefore,
      activeHazardsAfter: activeAfter,
      totalCountChanged: activeAfter !== activeBefore,
    },
    databaseStatusCounts: {
      before: statusBefore,
      after: countBy(statusRowsAfter, (row) => row.status),
    },
    unresolved: {
      unknownStatuses: unknownStatuses.map((item) => ({
        sheet: item.sheet, row: item.sourceRow, serial: item.serial, value: item.sourceStatus,
      })),
      unmatched: unmatched.map((item) => ({
        sheet: item.sheet, row: item.sourceRow, serial: item.serial,
      })),
      ambiguous: ambiguous.map((item) => ({
        sheet: item.candidate.sheet,
        row: item.candidate.sourceRow,
        serial: item.candidate.serial,
        matches: item.ids,
      })),
      fieldMismatches: fieldMismatches.map((item) => ({
        sheet: item.candidate.sheet,
        row: item.candidate.sourceRow,
        serial: item.candidate.serial,
        databaseId: item.id,
      })),
    },
  };

  fs.mkdirSync(path.dirname(args.report), { recursive: true });
  fs.writeFileSync(args.report, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await sequelize.close();
};

main().catch(async (error) => {
  console.error(error);
  try { await sequelize.close(); } catch (_) { /* noop */ }
  process.exit(1);
});

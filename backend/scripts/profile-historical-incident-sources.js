'use strict';

const crypto = require('crypto');
const path = require('path');
const ExcelJS = require('exceljs');

const files = process.argv.slice(2);

if (!files.length) {
  console.error('Usage: node scripts/profile-historical-incident-sources.js <workbook.xlsx> [...]');
  process.exit(1);
}

const normalizeText = (value) => String(value ?? '')
  .normalize('NFKC')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const cellText = (cell) => {
  const value = cell.value;
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== 'object') return String(value).trim();
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('').trim();
  if (value.formula || value.sharedFormula) return String(value.result ?? '').trim();
  if (value.text != null) return String(value.text).trim();
  return String(value.result ?? '').trim();
};

const normalizeHeader = (value) => normalizeText(value)
  .replace(/[.()/#&-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const headerAliases = {
  serial: ['s no', 's n', 's', 'sr', 'sr no', 'serial no'],
  year: ['year'],
  date: ['date', 'incident date'],
  description: ['description', 'incident details', 'incident detail', 'details'],
  shift: ['shift'],
  bodyType: ['body type'],
  bodyBreakdown: ['body type breakdown'],
  aspect: ['aspect wise', 'aspect analysis', 'short circuiting'],
  aspectBreakdown: ['aspect wise breakdown', 'aspect break down'],
  unsafeType: ['unsafe act unsafe condition'],
  areaManager: ['area manager'],
  gender: ['gendor wise', 'gender wise', 'gender'],
  location: ['location wise', 'area equipment', 'location'],
  department: ['dept', 'deptt', 'department'],
  category: ['incident category', 'category'],
  rootCause: ['root cause actions', 'root cause'],
  actionItems: ['actions items', 'action items'],
  responsibility: ['resp', 'responsibility'],
  status: ['status'],
  severity: ['severity'],
  processHuman: ['process human'],
};

const aliasLookup = new Map();
for (const [field, aliases] of Object.entries(headerAliases)) {
  for (const alias of aliases) aliasLookup.set(alias, field);
}

const parseDate = (value, yearHint) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return date.toISOString().slice(0, 10);
  }
  const text = String(value ?? '').trim();
  if (!text) return '';
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  const numericMatch = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (numericMatch) {
    const year = numericMatch[3].length === 2 ? `20${numericMatch[3]}` : numericMatch[3];
    return `${year}-${numericMatch[2].padStart(2, '0')}-${numericMatch[1].padStart(2, '0')}`;
  }
  const cleaned = text.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(/,/g, ' ');
  const parsed = new Date(`${cleaned}${/\b\d{4}\b/.test(cleaned) ? '' : ` ${yearHint || ''}`} UTC`);
  return Number.isNaN(parsed.getTime()) ? normalizeText(text) : parsed.toISOString().slice(0, 10);
};

const hashRecord = (record) => crypto.createHash('sha256').update([
  record.date,
  normalizeText(record.description),
  normalizeText(record.location),
  normalizeText(record.department),
].join('|')).digest('hex');

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

const locateTable = (sheet) => {
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 12); rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const columns = {};
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const normalized = normalizeHeader(cellText(cell));
      const field = aliasLookup.get(normalized);
      if (field && columns[field] == null) columns[field] = columnNumber;
    });
    if (columns.date && columns.description) return { headerRow: rowNumber, columns };
  }
  return null;
};

const profileSheet = (sheet) => {
  let formulaCells = 0;
  sheet.eachRow({ includeEmpty: false }, (row) => row.eachCell({ includeEmpty: false }, (cell) => {
    if (cell.type === ExcelJS.ValueType.Formula || (typeof cell.value === 'object' && cell.value?.formula)) formulaCells += 1;
  }));

  const table = locateTable(sheet);
  if (!table) {
    return {
      name: sheet.name,
      state: sheet.state || 'visible',
      kind: formulaCells ? 'summary-or-analysis' : 'non-record-sheet',
      rows: sheet.actualRowCount,
      columns: sheet.actualColumnCount,
      formulaCells,
      recordRows: 0,
      uniqueRecords: 0,
    };
  }

  const records = [];
  for (let rowNumber = table.headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const value = (field) => table.columns[field] ? cellText(row.getCell(table.columns[field])) : '';
    const description = value('description');
    const rawDate = table.columns.date ? row.getCell(table.columns.date).value : '';
    if (!description || !cellText(row.getCell(table.columns.date))) continue;
    const record = {
      row: rowNumber,
      serial: value('serial'),
      year: value('year'),
      date: parseDate(rawDate, value('year')),
      description,
      shift: value('shift'),
      bodyType: value('bodyType'),
      bodyBreakdown: value('bodyBreakdown'),
      aspect: value('aspect'),
      aspectBreakdown: value('aspectBreakdown'),
      unsafeType: value('unsafeType'),
      areaManager: value('areaManager'),
      gender: value('gender'),
      location: value('location'),
      department: value('department'),
      category: value('category'),
      rootCause: value('rootCause'),
      actionItems: value('actionItems'),
      responsibility: value('responsibility'),
      status: value('status'),
      severity: value('severity'),
      processHuman: value('processHuman'),
    };
    record.fingerprint = hashRecord(record);
    record.isLikelyRecord = /^\d+$/.test(record.serial)
      && /^20\d{2}$/.test(record.year || record.date.slice(0, 4))
      && /^20\d{2}-\d{2}-\d{2}$/.test(record.date);
    records.push(record);
  }

  const fingerprints = records.map((record) => record.fingerprint);
  const uniqueFingerprints = new Set(fingerprints);
  const validRecords = records.filter((record) => record.isLikelyRecord);
  const validFingerprints = new Set(validRecords.map((record) => record.fingerprint));
  const dates = uniqueSorted(records.map((record) => record.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)));

  return {
    name: sheet.name,
    state: sheet.state || 'visible',
    kind: records.length ? 'record-level' : 'header-only',
    rows: sheet.actualRowCount,
    columns: sheet.actualColumnCount,
    formulaCells,
    headerRow: table.headerRow,
    fields: Object.keys(table.columns),
    recordRows: records.length,
    uniqueRecords: uniqueFingerprints.size,
    duplicateRowsWithinSheet: records.length - uniqueFingerprints.size,
    validRecordRows: validRecords.length,
    uniqueValidRecords: validFingerprints.size,
    invalidCandidateRows: records.length - validRecords.length,
    serialRange: uniqueSorted(records.map((record) => record.serial)).length
      ? [uniqueSorted(records.map((record) => record.serial))[0], uniqueSorted(records.map((record) => record.serial)).slice(-1)[0]]
      : null,
    dateRange: dates.length ? [dates[0], dates[dates.length - 1]] : null,
    years: uniqueSorted(records.map((record) => record.year || record.date.slice(0, 4))),
    categories: uniqueSorted(records.map((record) => record.category)),
    departments: uniqueSorted(records.map((record) => record.department)),
    statuses: uniqueSorted(records.map((record) => record.status)),
    severities: uniqueSorted(records.map((record) => record.severity)),
    fingerprints: uniqueFingerprints,
    validFingerprints,
    validRecords,
    records,
  };
};

const run = async () => {
  for (const file of files) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    const profiles = workbook.worksheets.map(profileSheet);
    const recordProfiles = profiles.filter((profile) => profile.kind === 'record-level');
    const workbookFingerprints = new Set(recordProfiles.flatMap((profile) => [...profile.validFingerprints]));

    console.log(`\nWORKBOOK\t${path.basename(file)}\tsheets=${profiles.length}\trecordSheetRows=${recordProfiles.reduce((sum, profile) => sum + profile.recordRows, 0)}\tvalidRecordRows=${recordProfiles.reduce((sum, profile) => sum + profile.validRecordRows, 0)}\tuniqueAcrossSheets=${workbookFingerprints.size}`);
    for (const profile of profiles) {
      console.log(JSON.stringify({
        sheet: profile.name,
        state: profile.state,
        kind: profile.kind,
        rows: profile.rows,
        columns: profile.columns,
        formulas: profile.formulaCells,
        headerRow: profile.headerRow,
        fields: profile.fields,
        recordRows: profile.recordRows,
        uniqueRecords: profile.uniqueRecords,
        duplicateRowsWithinSheet: profile.duplicateRowsWithinSheet,
        validRecordRows: profile.validRecordRows,
        uniqueValidRecords: profile.uniqueValidRecords,
        invalidCandidateRows: profile.invalidCandidateRows,
        serialRange: profile.serialRange,
        dateRange: profile.dateRange,
        years: profile.years,
        categories: profile.categories,
        departments: profile.departments,
        statuses: profile.statuses,
        severities: profile.severities,
      }));
    }

    console.log('SHEET_OVERLAPS');
    for (let leftIndex = 0; leftIndex < recordProfiles.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < recordProfiles.length; rightIndex += 1) {
        const left = recordProfiles[leftIndex];
        const right = recordProfiles[rightIndex];
        const overlap = [...left.validFingerprints].filter((fingerprint) => right.validFingerprints.has(fingerprint)).length;
        if (overlap) console.log(`${left.name}\t${right.name}\t${overlap}`);
      }
    }

    const reference = recordProfiles[0];
    if (reference) {
      const outsideReference = new Map();
      for (const profile of recordProfiles.slice(1)) {
        for (const record of profile.validRecords) {
          if (reference.validFingerprints.has(record.fingerprint)) continue;
          const existing = outsideReference.get(record.fingerprint);
          if (existing) {
            existing.sheets.add(profile.name);
          } else {
            outsideReference.set(record.fingerprint, { record, sheets: new Set([profile.name]) });
          }
        }
      }
      console.log(`VALID_RECORDS_OUTSIDE_REFERENCE\treference=${reference.name}\tcount=${outsideReference.size}`);
      for (const { record, sheets } of [...outsideReference.values()].sort((a, b) => a.record.date.localeCompare(b.record.date))) {
        console.log(JSON.stringify({
          date: record.date,
          serial: record.serial,
          department: record.department,
          category: record.category,
          location: record.location,
          description: record.description.replace(/\s+/g, ' ').trim().slice(0, 180),
          sheets: [...sheets],
        }));
      }
    }
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

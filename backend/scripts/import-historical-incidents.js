'use strict';

require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../src/database/connection');
const {
  Department,
  Incident,
  IncidentInjury,
  Location,
  Plant,
} = require('../src/database/models');

const SOURCE_TYPE = 'historical_excel_import';
const DEFAULT_PLANT_ID = process.env.DEFAULT_PLANT_ID || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b';
const INJURY_SHEET = 'Master Sheet-V-2-13-March-26';
const INJURY_ACTION_SHEET = 'Master Sheet With Action items';
const FIRE_SHEET = 'Master Sheet-Final';

const SHEET_CLASSIFICATION = {
  injury: {
    [INJURY_SHEET]: 'canonical-record-source',
    'ADM-15-March': 'department-subset-copy',
    'PRD-15March': 'department-subset-copy',
    Sheet13: 'partial-working-copy',
    [INJURY_ACTION_SHEET]: 'record-enrichment-source',
    'action plan': 'aggregate-summary',
    'only added': 'working-copy-with-pivot-summary',
    'Working master Sheet': 'older-master-copy',
    'Body Part': 'analysis-subset-copy',
    ADM: 'department-subset-copy',
    PRJ: 'department-subset-copy',
    PRD: 'department-subset-copy',
    'Q.C': 'department-subset-copy',
    Stores: 'department-subset-copy',
    ESD: 'department-subset-copy',
  },
  fire: {
    [FIRE_SHEET]: 'canonical-record-source',
    'Master Sheet All': 'older-master-copy',
    'Master Sheet': 'older-master-copy',
    'HumanProcess-2Ag': 'analysis-working-copy',
    'ADM Human Process': 'department-subset-copy',
    'Updated HumanProcess': 'analysis-working-copy',
    'New HumanProcess-24jyuly': 'analysis-working-copy',
    'ESD Aspect': 'aspect-subset-copy',
    Sheet6: 'aggregate-summary',
    repair: 'aspect-subset-copy',
    'Short Circuit New': 'aspect-subset-copy',
    'PRD Human Process': 'department-subset-copy',
    Work2: 'analysis-working-copy',
    Work1: 'analysis-working-copy',
    'Short Circuit Updated': 'aspect-subset-copy',
    'PRD Aspect': 'aspect-subset-copy',
    'Store Aspect': 'aspect-subset-copy',
  },
};

// Excel stored several Pakistan dd/mm dates as US mm/dd Date cells. The
// overrides are keyed by the business S.No and were reconciled against each
// row's year, sequence, and explicit date wording in its description.
const INJURY_DATE_OVERRIDES = Object.freeze({
  34: '2024-01-06', 43: '2024-06-05', 44: '2024-06-11', 46: '2024-07-07',
  50: '2024-08-03', 51: '2024-08-10', 55: '2024-10-08', 57: '2024-11-02',
  58: '2024-11-11', 61: '2024-12-07', 62: '2024-12-09', 67: '2025-01-04',
  68: '2025-01-08', 69: '2025-01-09', 71: '2025-02-07', 72: '2025-02-08',
  73: '2025-02-12', 75: '2025-03-03', 76: '2025-03-03', 77: '2025-03-08',
  80: '2025-04-17', 81: '2025-05-03', 86: '2025-06-06', 87: '2025-07-08',
  88: '2025-07-20', 89: '2025-08-10', 90: '2025-08-21', 91: '2025-08-27',
  92: '2025-08-30', 96: '2025-11-11', 99: '2025-12-03', 100: '2025-12-09',
  101: '2026-01-06', 102: '2026-01-08', 103: '2026-01-08', 104: '2026-02-05',
  105: '2026-02-07', 108: '2026-03-03',
});

const FIRE_DATE_OVERRIDES = Object.freeze({
  24: '2024-02-01', 29: '2024-05-07', 32: '2024-07-01', 33: '2024-07-01',
  34: '2024-07-03', 35: '2024-07-10', 38: '2024-08-01', 39: '2024-08-05',
  42: '2024-09-07', 45: '2024-10-07', 47: '2024-11-12', 49: '2025-01-03',
  55: '2025-08-01', 56: '2025-08-11',
});

const normalizeText = (value) => String(value ?? '')
  .normalize('NFKC')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizedFingerprintText = (value) => normalizeText(value).toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const cellValue = (cell) => {
  const value = cell?.value;
  if (value == null) return '';
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
  if (value.formula || value.sharedFormula) return value.result ?? '';
  if (value.text != null) return value.text;
  return value.result ?? '';
};

const textCell = (row, column) => normalizeText(cellValue(row.getCell(column)));

const validIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const datePartsToIso = (year, month, day) => {
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return validIsoDate(iso) ? iso : '';
};

const MONTH_NUMBER = Object.freeze({
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10,
  october: 10, nov: 11, november: 11, dec: 12, december: 12,
});

const parsePakistanDate = (value, yearHint) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return datePartsToIso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return datePartsToIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }
  const text = normalizeText(value).replace(/,/g, ' ');
  if (!text) return '';
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return datePartsToIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,5})$/);
  if (numeric) {
    let year = Number(numeric[3]);
    if (year > 10000 && year % 10000 >= 2000 && year % 10000 <= 2100) year %= 10000;
    if (year < 100) year += 2000;
    return datePartsToIso(year, Number(numeric[2]), Number(numeric[1]));
  }
  const named = text.toLowerCase().replace(/(\d+)(st|nd|rd|th)/g, '$1')
    .match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (named && MONTH_NUMBER[named[2]]) {
    return datePartsToIso(Number(named[3] || yearHint), MONTH_NUMBER[named[2]], Number(named[1]));
  }
  return '';
};

const extractTime = (description) => {
  const text = normalizeText(description).toLowerCase();
  const twelveHour = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].startsWith('p')) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(Number(twelveHour[2] || 0)).padStart(2, '0')}:00`;
  }
  const clock = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:hrs?|hours?)?\b/);
  if (clock) return `${String(Number(clock[1])).padStart(2, '0')}:${clock[2]}:00`;
  const military = text.match(/\b([0-2]?\d{3})\s*(?:hrs?|hours?)\b/);
  if (military) {
    const digits = military[1].padStart(4, '0');
    const hour = Number(digits.slice(0, 2));
    const minute = Number(digits.slice(2));
    if (hour < 24 && minute < 60) return `${digits.slice(0, 2)}:${digits.slice(2)}:00`;
  }
  return null;
};

const CATEGORY_MAP = Object.freeze({
  firstaid: { value: 'first_aid', label: 'First Aid' },
  firstaidcase: { value: 'first_aid', label: 'First Aid' },
  fa: { value: 'first_aid', label: 'First Aid' },
  medicaltreatment: { value: 'mtc', label: 'MTC' },
  medicaltreatmentcase: { value: 'mtc', label: 'MTC' },
  mtc: { value: 'mtc', label: 'MTC' },
  restrictedwork: { value: 'rwc', label: 'RWC' },
  restrictedworkcase: { value: 'rwc', label: 'RWC' },
  rwc: { value: 'rwc', label: 'RWC' },
  losttimeinjury: { value: 'lti', label: 'LTI' },
  lti: { value: 'lti', label: 'LTI' },
  fatality: { value: 'fatality', label: 'Fatality' },
  fire: { value: 'fire', label: 'Fire' },
  fireincident: { value: 'fire', label: 'Fire' },
});

const DEPARTMENT_ALIASES = Object.freeze({
  adm: 'ADM', admin: 'ADM', administration: 'ADM',
  esd: 'ESD',
  hse: 'HSE',
  it: 'IT',
  prd: 'PRD', production: 'PRD',
  prj: 'Projects', project: 'Projects', projects: 'Projects',
  qc: 'QC/FS/NPD', qcnpdfs: 'QC/FS/NPD', qcfsnpd: 'QC/FS/NPD',
  stores: 'Stores', store: 'Stores',
});

const LOCATION_ALIASES = Object.freeze({
  chemicalroomgf: 'chemicalroomgroundfloor',
});

const categoryFor = (rawValue) => CATEGORY_MAP[normalizeKey(rawValue)] || null;
const departmentCodeFor = (rawValue) => DEPARTMENT_ALIASES[normalizeKey(rawValue)] || null;
const locationKeyFor = (rawValue) => LOCATION_ALIASES[normalizeKey(rawValue)] || normalizeKey(rawValue);

const fingerprint = ({ incidentDate, incidentType, departmentCode, location, description }) => crypto
  .createHash('sha256')
  .update([
    incidentDate,
    normalizeKey(incidentType),
    normalizeKey(departmentCode),
    locationKeyFor(location),
    normalizedFingerprintText(description),
  ].join('|'))
  .digest('hex');

const inventoryWorkbook = (workbook, kind) => workbook.worksheets.map((sheet) => ({
  name: sheet.name,
  state: sheet.state || 'visible',
  rows: sheet.actualRowCount,
  columns: sheet.actualColumnCount,
  mergedRanges: Object.keys(sheet._merges || {}).length,
  classification: SHEET_CLASSIFICATION[kind][sheet.name] || 'reviewed-noncanonical-sheet',
}));

const severityValue = (value) => ({ low: 'low', medium: 'medium', high: 'high', critical: 'critical' }[normalizeText(value).toLowerCase()] || 'unknown');
const actionStatusValue = (value) => ({ closed: 'Closed', open: 'Open', planned: 'Planned' }[normalizeText(value).toLowerCase()] || normalizeText(value));
const highestSeverity = (actions) => {
  const order = { unknown: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return actions.reduce((highest, action) => order[severityValue(action.severity)] > order[highest]
    ? severityValue(action.severity)
    : highest, 'unknown');
};

const loadWorkbook = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
};

const readInjuryActions = (workbook) => {
  const sheet = workbook.getWorksheet(INJURY_ACTION_SHEET);
  if (!sheet) throw new Error(`Missing injury enrichment sheet: ${INJURY_ACTION_SHEET}`);
  const bySerial = new Map();
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const serial = Number(textCell(row, 1));
    if (!Number.isInteger(serial) || serial < 1 || serial > 100) continue;
    const rootCause = textCell(row, 16);
    const actionText = textCell(row, 17);
    const responsibility = textCell(row, 18);
    const status = textCell(row, 19);
    const severity = textCell(row, 20);
    const current = bySerial.get(serial) || { rootCauses: [], actions: [] };
    if (rootCause && !current.rootCauses.includes(rootCause)) current.rootCauses.push(rootCause);
    if (actionText) {
      const actionKey = [normalizeKey(actionText), normalizeKey(responsibility), normalizeKey(status)].join('|');
      if (!current.actions.some((item) => item.key === actionKey)) {
        current.actions.push({
          key: actionKey,
          action: actionText,
          responsible_person: '',
          responsible_department: departmentCodeFor(responsibility) || responsibility,
          timeline: '',
          severity: severity ? `${severity.charAt(0).toUpperCase()}${severity.slice(1).toLowerCase()}` : '',
          status: actionStatusValue(status),
          source_row: rowNumber,
        });
      }
    }
    bySerial.set(serial, current);
  }
  return bySerial;
};

const incidentStatusFromActions = (actions) => {
  const statuses = actions.map((action) => normalizeText(action.status).toLowerCase()).filter(Boolean);
  if (!statuses.length) return 'reported';
  return statuses.every((status) => status === 'closed') ? 'closed' : 'corrective_action';
};

const readInjuryRecords = (workbook, workbookName, issues) => {
  const sheet = workbook.getWorksheet(INJURY_SHEET);
  if (!sheet) throw new Error(`Missing canonical injury sheet: ${INJURY_SHEET}`);
  const actionsBySerial = readInjuryActions(workbook);
  const records = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const serial = Number(textCell(row, 1));
    if (!Number.isInteger(serial) || serial < 1 || serial > 108) continue;
    const year = Number(textCell(row, 2));
    const rawDate = cellValue(row.getCell(3));
    const incidentDate = INJURY_DATE_OVERRIDES[serial] || parsePakistanDate(rawDate, year);
    const description = textCell(row, 4);
    const rawCategory = textCell(row, 15);
    const category = categoryFor(rawCategory);
    const rawDepartment = textCell(row, 14);
    const departmentCode = departmentCodeFor(rawDepartment);
    const location = textCell(row, 13);
    const enrichment = actionsBySerial.get(serial) || { rootCauses: [], actions: [] };
    const actions = enrichment.actions.map((action) => ({
      action: action.action,
      responsible_person: action.responsible_person,
      responsible_department: action.responsible_department,
      timeline: action.timeline,
      severity: action.severity,
      status: action.status,
      source_row: action.source_row,
    }));
    const validation = [];
    if (!validIsoDate(incidentDate)) validation.push('invalid_date');
    if (!description) validation.push('missing_description');
    if (!category) validation.push(`unknown_category:${rawCategory || '<blank>'}`);
    if (!departmentCode) validation.push(`unknown_department:${rawDepartment || '<blank>'}`);
    if (!location) validation.push('missing_location');
    if (validation.length) {
      issues.invalid.push({ workbook: workbookName, sheet: INJURY_SHEET, row: rowNumber, serial, reasons: validation });
      continue;
    }
    if (INJURY_DATE_OVERRIDES[serial]) {
      issues.normalized.push({ workbook: workbookName, sheet: INJURY_SHEET, row: rowNumber, serial, field: 'date', from: normalizeText(rawDate), to: incidentDate });
    }
    records.push({
      kind: 'injury',
      serial,
      sourceRow: rowNumber,
      sourceWorkbook: workbookName,
      sourceSheet: INJURY_SHEET,
      incidentDate,
      incidentTime: extractTime(description),
      incidentType: category.value,
      categoryLabel: category.label,
      departmentCode,
      rawDepartment,
      location,
      title: `Historical ${category.label} incident - ${location}`,
      description,
      severityLevel: highestSeverity(actions),
      status: incidentStatusFromActions(actions),
      immediateAction: actions.map((action) => action.action).filter(Boolean).join('\n') || null,
      rootCause: enrichment.rootCauses.join('\n') || null,
      firstAidGiven: category.value === 'first_aid',
      injury: {
        bodyPart: textCell(row, 6) || null,
        injuryType: textCell(row, 7) || null,
        description: [textCell(row, 6), textCell(row, 7)].filter(Boolean).join(' - ') || null,
      },
      metadata: {
        historical_source: true,
        source_event_serial: serial,
        source_year: year,
        source_date_value: normalizeText(rawDate),
        source_category: rawCategory,
        incident_category_id: category.label,
        department_code: departmentCode,
        department_name: departmentCode,
        shift: textCell(row, 5),
        body_type: textCell(row, 6),
        body_type_breakdown: textCell(row, 7),
        aspect: textCell(row, 8),
        aspect_breakdown: textCell(row, 9),
        unsafe_act_or_condition: textCell(row, 10),
        area_manager: textCell(row, 11),
        gender: textCell(row, 12),
        source_location: location,
        actions,
        status_id: incidentStatusFromActions(actions) === 'closed' ? 'Closed'
          : incidentStatusFromActions(actions) === 'corrective_action' ? 'Work in Progress' : 'Open',
        risk_rating_id: highestSeverity(actions) === 'unknown' ? 'Unknown'
          : `${highestSeverity(actions).charAt(0).toUpperCase()}${highestSeverity(actions).slice(1)}`,
        employee_data_available: false,
      },
    });
  }
  return records;
};

const readFireRecords = (workbook, workbookName, issues) => {
  const sheet = workbook.getWorksheet(FIRE_SHEET);
  if (!sheet) throw new Error(`Missing canonical fire sheet: ${FIRE_SHEET}`);
  const records = [];
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const serial = Number(textCell(row, 1));
    if (!Number.isInteger(serial) || serial < 1 || serial > 58) continue;
    const year = Number(textCell(row, 2));
    const rawDate = cellValue(row.getCell(3));
    const incidentDate = FIRE_DATE_OVERRIDES[serial] || parsePakistanDate(rawDate, year);
    const description = textCell(row, 4);
    const rawDepartment = textCell(row, 8);
    const departmentCode = departmentCodeFor(rawDepartment);
    const location = textCell(row, 6);
    const validation = [];
    if (!validIsoDate(incidentDate)) validation.push('invalid_date');
    if (!description) validation.push('missing_description');
    if (!departmentCode) validation.push(`unknown_department:${rawDepartment || '<blank>'}`);
    if (!location) validation.push('missing_location');
    if (validation.length) {
      issues.invalid.push({ workbook: workbookName, sheet: FIRE_SHEET, row: rowNumber, serial, reasons: validation });
      continue;
    }
    if (FIRE_DATE_OVERRIDES[serial]) {
      issues.normalized.push({ workbook: workbookName, sheet: FIRE_SHEET, row: rowNumber, serial, field: 'date', from: normalizeText(rawDate), to: incidentDate });
    }
    if (serial === 58) {
      issues.ambiguous.push({
        workbook: workbookName,
        sheet: FIRE_SHEET,
        row: rowNumber,
        serial,
        reason: 'date_description_mismatch',
        resolution: 'Kept authoritative Date column (18-Nov-2025); description says 19-Nov-2025 and is preserved verbatim.',
      });
    }
    records.push({
      kind: 'fire',
      serial,
      sourceRow: rowNumber,
      sourceWorkbook: workbookName,
      sourceSheet: FIRE_SHEET,
      incidentDate,
      incidentTime: extractTime(description),
      incidentType: 'fire',
      categoryLabel: 'Fire',
      departmentCode,
      rawDepartment,
      location,
      title: `Historical Fire incident - ${location}`,
      description,
      severityLevel: 'unknown',
      status: 'reported',
      immediateAction: null,
      rootCause: textCell(row, 11) || null,
      firstAidGiven: false,
      injury: null,
      metadata: {
        historical_source: true,
        source_event_serial: serial,
        source_year: year,
        source_date_value: normalizeText(rawDate),
        source_category: 'Fire Incident Log',
        incident_category_id: 'Fire',
        department_code: departmentCode,
        department_name: departmentCode,
        shift: textCell(row, 5),
        process_or_human: textCell(row, 7),
        aspect: textCell(row, 9),
        aspect_breakdown: textCell(row, 10),
        source_location: location,
        status_id: 'Open',
        risk_rating_id: 'Unknown',
        source_status_available: false,
        source_severity_available: false,
        employee_data_available: false,
        ...(serial === 58 ? { date_description_mismatch: true } : {}),
      },
    });
  }
  return records;
};

const chooseMasterLocation = (locations, sourceName) => {
  const key = locationKeyFor(sourceName);
  const candidates = locations.filter((location) => locationKeyFor(location.name) === key || locationKeyFor(location.code) === key);
  return candidates.sort((left, right) => Number(right.isActive) - Number(left.isActive)
    || Number(Boolean(right.code)) - Number(Boolean(left.code))
    || String(left.createdAt || '').localeCompare(String(right.createdAt || '')))[0] || null;
};

const parseArguments = (argv) => {
  const args = { commit: false, report: null, injury: null, fire: null, plantId: null, userId: null };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--commit') args.commit = true;
    else if (token === '--dry-run') args.commit = false;
    else if (['--injury', '--fire', '--report', '--plant-id', '--user-id'].includes(token)) {
      const key = ({ '--injury': 'injury', '--fire': 'fire', '--report': 'report', '--plant-id': 'plantId', '--user-id': 'userId' })[token];
      args[key] = argv[index + 1];
      index += 1;
    } else throw new Error(`Unknown argument: ${token}`);
  }
  if (!args.injury || !args.fire) {
    throw new Error('Usage: npm run import:incidents -- --injury <injury.xlsx> --fire <fire.xlsx> [--dry-run|--commit] [--report report.json]');
  }
  args.injury = path.resolve(args.injury);
  args.fire = path.resolve(args.fire);
  if (args.report) args.report = path.resolve(args.report);
  return args;
};

const run = async () => {
  const args = parseArguments(process.argv.slice(2));
  for (const filePath of [args.injury, args.fire]) {
    if (!fs.existsSync(filePath)) throw new Error(`Workbook not found: ${filePath}`);
  }

  const [injuryWorkbook, fireWorkbook] = await Promise.all([
    loadWorkbook(args.injury),
    loadWorkbook(args.fire),
  ]);
  const issues = { normalized: [], ambiguous: [], invalid: [] };
  const injuryRecords = readInjuryRecords(injuryWorkbook, path.basename(args.injury), issues);
  const fireRecords = readFireRecords(fireWorkbook, path.basename(args.fire), issues);
  const candidates = [...injuryRecords, ...fireRecords];

  const plant = await Plant.findByPk(args.plantId || DEFAULT_PLANT_ID)
    || await Plant.findOne({ where: { isActive: true }, order: [['createdAt', 'ASC']] });
  // The legacy users model is intentionally not used here: some development
  // databases still expose the full migration-era user columns while that
  // model is mid-refactor. A narrow read keeps the import accountable without
  // depending on unrelated authentication fields.
  const users = await sequelize.query(`
    SELECT id, email
    FROM users
    WHERE deleted_at IS NULL
      ${args.userId ? 'AND id = :userId' : ''}
    ORDER BY created_at ASC
    LIMIT 1
  `, { replacements: { userId: args.userId }, type: QueryTypes.SELECT });
  const [user] = users;
  if (!plant) throw new Error('No active plant found. Pass --plant-id <UUID>.');
  if (!user) throw new Error('No active import user found. Pass --user-id <UUID>.');

  const departments = await Department.findAll({ where: { deletedAt: null }, paranoid: false });
  const departmentByCode = new Map();
  for (const department of departments) {
    for (const key of [normalizeKey(department.code), normalizeKey(department.name)]) {
      const canonical = DEPARTMENT_ALIASES[key] || department.code;
      if (canonical && department.isActive && !departmentByCode.has(canonical)) departmentByCode.set(canonical, department);
    }
  }
  const unknownDepartments = [...new Set(candidates.map((record) => record.departmentCode).filter((code) => !departmentByCode.has(code)))];
  if (unknownDepartments.length) {
    unknownDepartments.forEach((department) => issues.invalid.push({ reason: 'department_not_in_master', department }));
  }

  const locations = await Location.findAll({ paranoid: false });
  const locationResolution = new Map();
  const newLocations = [];
  const pendingLocationByKey = new Map();
  for (const locationName of [...new Set(candidates.map((record) => record.location))]) {
    const existing = chooseMasterLocation(locations, locationName);
    if (existing) locationResolution.set(locationName, existing);
    else {
      const canonicalKey = locationKeyFor(locationName);
      const pending = pendingLocationByKey.get(canonicalKey) || {
        id: crypto.randomUUID(),
        plantId: plant.id,
        name: locationName,
        code: `HIST-${crypto.createHash('sha1').update(locationKeyFor(locationName)).digest('hex').slice(0, 10).toUpperCase()}`,
        normalizedName: normalizeText(locationName).toLowerCase(),
        isActive: true,
        createdBy: user.id,
        updatedBy: user.id,
      };
      if (!pendingLocationByKey.has(canonicalKey)) {
        pendingLocationByKey.set(canonicalKey, pending);
        newLocations.push(pending);
      }
      locationResolution.set(locationName, pending);
    }
  }

  const resolvedCandidates = candidates
    .filter((record) => departmentByCode.has(record.departmentCode))
    .map((record) => {
      const department = departmentByCode.get(record.departmentCode);
      const locationRecord = locationResolution.get(record.location);
      const sourceHash = fingerprint(record);
      return { ...record, department, locationRecord, sourceHash };
    });

  const seenSourceHashes = new Set();
  const duplicateCandidates = [];
  const uniqueCandidates = [];
  for (const record of resolvedCandidates) {
    if (seenSourceHashes.has(record.sourceHash)) duplicateCandidates.push(record);
    else {
      seenSourceHashes.add(record.sourceHash);
      uniqueCandidates.push(record);
    }
  }

  const existingIncidents = await Incident.findAll({
    include: [{ model: Department, as: 'department', attributes: ['code', 'name'], required: false }],
    paranoid: false,
  });
  const existingHashes = new Set();
  for (const incident of existingIncidents) {
    if (incident.sourceHash) existingHashes.add(incident.sourceHash);
    existingHashes.add(fingerprint({
      incidentDate: incident.incidentDate,
      incidentType: incident.incidentType,
      departmentCode: incident.department?.code || incident.department?.name || incident.metadata?.department_code || '',
      location: incident.location || incident.metadata?.source_location || '',
      description: incident.description,
    }));
  }
  const alreadyExisting = uniqueCandidates.filter((record) => existingHashes.has(record.sourceHash));
  const toInsert = uniqueCandidates.filter((record) => !existingHashes.has(record.sourceHash));

  const insertedByType = toInsert.reduce((counts, record) => {
    counts[record.categoryLabel] = (counts[record.categoryLabel] || 0) + 1;
    return counts;
  }, {});

  const report = {
    mode: args.commit ? 'commit' : 'dry-run',
    generatedAt: new Date().toISOString(),
    sourceType: SOURCE_TYPE,
    database: sequelize.getDatabaseName(),
    plant: { id: plant.id, name: plant.name, code: plant.code },
    importUser: { id: user.id, email: user.email },
    workbooks: [
      {
        name: path.basename(args.injury),
        worksheets: inventoryWorkbook(injuryWorkbook, 'injury'),
        canonicalSheet: INJURY_SHEET,
        enrichmentSheet: INJURY_ACTION_SHEET,
        canonicalCandidates: injuryRecords.length,
      },
      {
        name: path.basename(args.fire),
        worksheets: inventoryWorkbook(fireWorkbook, 'fire'),
        canonicalSheet: FIRE_SHEET,
        canonicalCandidates: fireRecords.length,
      },
    ],
    reconciliation: {
      injuryCanonicalCandidates: injuryRecords.length,
      fireCanonicalCandidates: fireRecords.length,
      totalCanonicalCandidates: candidates.length,
      invalidCandidates: issues.invalid.length,
      exactDuplicatesWithinCanonicalSources: duplicateCandidates.length,
      existingDatabaseDuplicates: alreadyExisting.length,
      recordsToInsert: toInsert.length,
      locationsToCreate: newLocations.length,
      incidentInjuriesToInsert: toInsert.filter((record) => record.injury).length,
      byClassification: insertedByType,
    },
    mappings: {
      categories: CATEGORY_MAP,
      departments: Object.fromEntries([...new Set(candidates.map((record) => record.departmentCode))].map((code) => [code, departmentByCode.get(code)?.id || null])),
      locations: Object.fromEntries([...locationResolution.entries()].map(([source, location]) => [source, { id: location.id, name: location.name, create: newLocations.some((item) => item.id === location.id) }])),
    },
    issues,
    duplicateCandidates: duplicateCandidates.map((record) => ({ workbook: record.sourceWorkbook, sheet: record.sourceSheet, row: record.sourceRow, serial: record.serial, hash: record.sourceHash })),
    alreadyExisting: alreadyExisting.map((record) => ({ workbook: record.sourceWorkbook, sheet: record.sourceSheet, row: record.sourceRow, serial: record.serial, hash: record.sourceHash })),
  };

  if (args.commit && toInsert.length) {
    await sequelize.transaction(async (transaction) => {
      if (newLocations.length) await Location.bulkCreate(newLocations, { transaction });
      const importedAt = new Date();
      const incidentRows = toInsert.map((record) => ({
        id: crypto.randomUUID(),
        incidentNumber: `HIST-${record.kind === 'fire' ? 'FIR' : 'INJ'}-${record.incidentDate.slice(0, 4)}-${String(record.serial).padStart(4, '0')}`,
        reportedBy: user.id,
        plantId: plant.id,
        departmentId: record.department.id,
        locationId: record.locationRecord.id,
        sourceType: SOURCE_TYPE,
        sourceHash: record.sourceHash,
        sourceWorkbook: record.sourceWorkbook,
        sourceSheet: record.sourceSheet,
        sourceRow: record.sourceRow,
        importedAt,
        incidentType: record.incidentType,
        status: record.status,
        severityLevel: record.severityLevel,
        title: record.title,
        description: record.description,
        location: record.locationRecord.name,
        incidentDate: record.incidentDate,
        incidentTime: record.incidentTime,
        firstAidGiven: record.firstAidGiven,
        immediateAction: record.immediateAction,
        rootCause: record.rootCause,
        createdBy: user.id,
        updatedBy: user.id,
        metadata: {
          ...record.metadata,
          source_type: SOURCE_TYPE,
          source_workbook: record.sourceWorkbook,
          source_sheet: record.sourceSheet,
          source_row: record.sourceRow,
          source_hash: record.sourceHash,
          location_id: record.locationRecord.id,
          location_name: record.locationRecord.name,
          department_id: record.department.id,
        },
      }));
      const incidentIdByHash = new Map(incidentRows.map((row) => [row.sourceHash, row.id]));
      await Incident.bulkCreate(incidentRows, { transaction, validate: true });
      const injuryRows = toInsert.filter((record) => record.injury).map((record) => ({
        id: crypto.randomUUID(),
        incidentId: incidentIdByHash.get(record.sourceHash),
        bodyPart: record.injury.bodyPart,
        injuryType: record.injury.injuryType,
        description: record.injury.description,
      }));
      if (injuryRows.length) await IncidentInjury.bulkCreate(injuryRows, { transaction, validate: true });
    });
  }

  if (args.report) {
    await fs.promises.mkdir(path.dirname(args.report), { recursive: true });
    await fs.promises.writeFile(args.report, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

run()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());

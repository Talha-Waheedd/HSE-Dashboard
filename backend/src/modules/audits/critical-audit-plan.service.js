'use strict';

const { createHash } = require('crypto');
const ExcelJS = require('exceljs');
const { sequelize } = require('../../database/connection');
const { CriticalAuditPlan, HseAudit, Plant } = require('../../database/models');
const ApiError = require('../../shared/utils/ApiError');

const MONTHS = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
  april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
  august: 8, aug: 8, september: 9, sep: 9, october: 10, oct: 10,
  november: 11, nov: 11, december: 12, dec: 12,
};

const cellValue = (cell) => {
  const value = cell?.value;
  if (value && typeof value === 'object' && 'result' in value) return value.result;
  if (value && typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join('');
  }
  return value;
};

const textValue = (cell) => {
  const value = cellValue(cell);
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
};

const isoDate = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
};

const excelSerialToDate = (serial) => {
  const milliseconds = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(milliseconds).toISOString().slice(0, 10);
};

const parseExplicitDate = (value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 31) return excelSerialToDate(value);
  const raw = String(value ?? '').trim();
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = raw.match(/^(\d{1,2})[\s\-/]([A-Za-z]{3,9}|\d{1,2})[\s\-/](\d{2,4})$/);
  if (!match) return null;
  const month = /^\d+$/.test(match[2]) ? Number(match[2]) : MONTHS[match[2].toLowerCase()];
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  return month ? isoDate(year, month, Number(match[1])) : null;
};

const parseMonthHeader = (cell) => {
  const value = cellValue(cell);
  if (value instanceof Date) return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1 };
  if (typeof value === 'number' && value > 31) {
    const parsed = new Date(`${excelSerialToDate(value)}T00:00:00Z`);
    return { year: parsed.getUTCFullYear(), month: parsed.getUTCMonth() + 1 };
  }
  const text = String(value ?? '').trim();
  const match = text.match(/([A-Za-z]{3,9})[\s\-/]*(\d{2,4})/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const yearNumber = Number(match[2]);
  return month ? { year: yearNumber < 100 ? 2000 + yearNumber : yearNumber, month } : null;
};

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const expandScheduleCell = (cell, headerMonth, warnings) => {
  const value = cellValue(cell);
  const raw = textValue(cell);
  if (!raw || /^[_\-–—\s]+$/.test(raw)) return [];

  const explicit = parseExplicitDate(value) || parseExplicitDate(raw);
  if (explicit) {
    const [year, month] = explicit.split('-').map(Number);
    if (year !== headerMonth.year || month !== headerMonth.month) {
      warnings.push(`${cell.address}: explicit date ${explicit} does not match its ${headerMonth.year}-${String(headerMonth.month).padStart(2, '0')} schedule column; the explicit date was preserved.`);
    }
    return [explicit];
  }

  if (/\bdaily\b/i.test(raw)) {
    return Array.from({ length: daysInMonth(headerMonth.year, headerMonth.month) }, (_, index) => (
      isoDate(headerMonth.year, headerMonth.month, index + 1)
    ));
  }

  const days = [...raw.matchAll(/\d{1,2}/g)].map((match) => Number(match[0])).filter((day) => day >= 1 && day <= 31);
  if (days.length) {
    return [...new Set(days.map((day) => isoDate(headerMonth.year, headerMonth.month, day)).filter(Boolean))];
  }

  warnings.push(`${cell.address}: unsupported schedule value "${raw}" was retained in the plan but did not create an Audit Log.`);
  return [];
};

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'wip' || normalized === 'work in progress') return 'WIP';
  if (normalized === 'done' || normalized === 'completed') return 'Done';
  return 'Pending';
};

const logStatusForPlan = (status) => ({ Pending: 'planned', WIP: 'in_progress', Done: 'completed' }[status] || 'planned');
const titleCase = (value) => String(value || '').trim().toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const comparableText = (value) => String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '');

const parseWorkbook = async (buffer, filename) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets.find((sheet) => /critical\s*audit\s*plan/i.test(sheet.name)) || workbook.worksheets[0];
  if (!worksheet) throw ApiError.badRequest('The workbook does not contain a worksheet.');

  let headerRowNumber = 0;
  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 20); rowNumber += 1) {
    const first = textValue(worksheet.getRow(rowNumber).getCell(1)).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (first === 'sno' || first === 'srno') { headerRowNumber = rowNumber; break; }
  }
  if (!headerRowNumber) throw ApiError.badRequest('Could not find the Critical Audit Plan header row (S.No).');

  const headerRow = worksheet.getRow(headerRowNumber);
  const headers = new Map();
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    headers.set(textValue(headerRow.getCell(column)).toLowerCase().replace(/[^a-z0-9]/g, ''), column);
  }
  const columnOf = (...names) => names.map((name) => headers.get(name)).find(Boolean);
  const columns = {
    serial: columnOf('sno', 'srno'),
    area: columnOf('areaname'),
    owners: columnOf('areaowners', 'areaowner'),
    objective: columnOf('auditobjectivealignedwithhsestandards', 'auditobjective'),
    risk: columnOf('riskrating'),
    auditors: columnOf('auditors', 'auditor'),
    frequency: columnOf('frequency'),
    status: columnOf('status'),
  };
  if (!columns.serial || !columns.area || !columns.status) throw ApiError.badRequest('Required columns S.No, Area Name, or Status are missing.');

  const monthColumns = [];
  for (let column = (columns.frequency || 7) + 1; column < columns.status; column += 1) {
    const month = parseMonthHeader(headerRow.getCell(column));
    if (month) monthColumns.push({ column, ...month, label: textValue(headerRow.getCell(column)) });
  }
  if (!monthColumns.length) throw ApiError.badRequest('No month/date schedule columns were found.');

  const warnings = [];
  const title = textValue(worksheet.getRow(Math.max(1, headerRowNumber - 1)).getCell(1)) || textValue(worksheet.getRow(1).getCell(1));
  const rows = [];
  const serials = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const areaName = textValue(row.getCell(columns.area));
    const serialText = textValue(row.getCell(columns.serial));
    if (!areaName && !serialText) continue;
    const serialNumber = Number.parseInt(serialText, 10);
    if (Number.isInteger(serialNumber)) serials.push(serialNumber);
    const schedule = monthColumns.map((monthColumn) => {
      const cell = row.getCell(monthColumn.column);
      const dates = expandScheduleCell(cell, monthColumn, warnings);
      return { column: cell.address.replace(/\d+$/, ''), month: monthColumn.label, raw: textValue(cell), dates };
    }).filter((entry) => entry.raw || entry.dates.length);
    rows.push({
      sourceRow: rowNumber,
      serialNumber: Number.isInteger(serialNumber) ? serialNumber : null,
      areaName,
      areaOwners: textValue(row.getCell(columns.owners)),
      auditObjective: textValue(row.getCell(columns.objective)),
      riskRating: titleCase(textValue(row.getCell(columns.risk))),
      auditors: textValue(row.getCell(columns.auditors)),
      frequency: textValue(row.getCell(columns.frequency)),
      status: normalizeStatus(textValue(row.getCell(columns.status))),
      schedule,
      dates: [...new Set(schedule.flatMap((entry) => entry.dates))].sort(),
    });
  }

  const sortedSerials = [...new Set(serials)].sort((left, right) => left - right);
  for (let index = 1; index < sortedSerials.length; index += 1) {
    for (let missing = sortedSerials[index - 1] + 1; missing < sortedSerials[index]; missing += 1) {
      warnings.push(`The source workbook has no plan row with S.No ${missing}.`);
    }
  }
  return { filename, sheetName: worksheet.name, title, rows, warnings };
};

const sourceKeyFor = (plantId, workbookTitle, row) => createHash('sha256')
  .update(`${plantId}|${workbookTitle}|${row.serialNumber ?? row.sourceRow}`)
  .digest('hex');

const auditNumberFor = (sourceKey, date) => `CAP-${sourceKey.slice(0, 8).toUpperCase()}-${date.replaceAll('-', '')}`;

class CriticalAuditPlanService {
  async importWorkbook({ buffer, filename, plantId, userId }) {
    const plant = await Plant.findByPk(plantId);
    if (!plant) throw ApiError.notFound('Plant not found.');
    const parsed = await parseWorkbook(buffer, filename);
    const transaction = await sequelize.transaction();
    const result = { planRows: 0, scheduledOccurrences: 0, createdLogs: 0, linkedExistingLogs: 0, existingLogs: 0, warnings: parsed.warnings };

    try {
      for (const row of parsed.rows) {
        const sourceKey = sourceKeyFor(plantId, parsed.title, row);
        const planValues = {
          plantId,
          sourceKey,
          sourceFile: filename,
          sourceSheet: parsed.sheetName,
          sourceTitle: parsed.title,
          sourceRow: row.sourceRow,
          serialNumber: row.serialNumber,
          areaName: row.areaName,
          areaOwners: row.areaOwners || null,
          auditObjective: row.auditObjective || null,
          riskRating: row.riskRating || null,
          auditors: row.auditors || null,
          frequency: row.frequency || null,
          status: row.status,
          scheduleData: row.schedule,
          importedAt: new Date(),
          importedBy: userId,
        };
        let plan = await CriticalAuditPlan.findOne({ where: { sourceKey }, paranoid: false, transaction });
        if (plan) {
          if (plan.deletedAt) await plan.restore({ transaction });
          await plan.update(planValues, { transaction });
        } else {
          plan = await CriticalAuditPlan.create(planValues, { transaction });
        }
        result.planRows += 1;
        result.scheduledOccurrences += row.dates.length;

        for (const scheduledDate of row.dates) {
          let audit = await HseAudit.findOne({
            where: { criticalAuditPlanId: plan.id, scheduledDate },
            transaction,
          });
          if (audit) {
            if (audit.plantId !== plantId) await audit.update({ plantId }, { transaction });
            result.existingLogs += 1;
            continue;
          }

          const candidates = await HseAudit.findAll({
            where: { criticalAuditPlanId: null, scheduledDate },
            transaction,
          });
          audit = candidates.find((candidate) => comparableText(candidate.title) === comparableText(row.areaName));
          if (audit) {
            await audit.update({
              plantId,
              criticalAuditPlanId: plan.id,
              source: 'critical-audit-plan',
              areaOwner: audit.areaOwner || row.areaOwners || null,
              auditObjective: audit.auditObjective || row.auditObjective || audit.scope || null,
              riskRating: audit.riskRating || row.riskRating || null,
              auditors: audit.auditors || row.auditors || null,
              frequency: audit.frequency || row.frequency || null,
            }, { transaction });
            result.linkedExistingLogs += 1;
            continue;
          }

          await HseAudit.create({
            plantId,
            criticalAuditPlanId: plan.id,
            auditNumber: auditNumberFor(sourceKey, scheduledDate),
            title: row.areaName,
            areaOwner: row.areaOwners || null,
            auditObjective: row.auditObjective || null,
            riskRating: row.riskRating || null,
            auditors: row.auditors || null,
            frequency: row.frequency || null,
            auditType: 'internal',
            source: 'critical-audit-plan',
            status: logStatusForPlan(row.status),
            auditedBy: userId,
            scheduledDate,
            scope: row.auditObjective || null,
            createdBy: userId,
          }, { transaction });
          result.createdLogs += 1;
        }
      }
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async listPlans(options) {
    const result = await CriticalAuditPlan.findAndCountAll(options);
    const rows = await Promise.all(result.rows.map(async (plan) => {
      const values = plan.toJSON();
      values.occurrenceCount = await HseAudit.count({ where: { criticalAuditPlanId: plan.id } });
      return values;
    }));
    return { count: result.count, rows };
  }
}

module.exports = new CriticalAuditPlanService();
module.exports.parseWorkbook = parseWorkbook;

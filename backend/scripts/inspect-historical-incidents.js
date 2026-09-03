'use strict';

const path = require('path');
const ExcelJS = require('exceljs');

const args = process.argv.slice(2);
const compact = args.includes('--compact');
const summaryOnly = args.includes('--summary-only');
const sheetArgumentIndex = args.indexOf('--sheet');
const selectedSheet = sheetArgumentIndex >= 0 ? args[sheetArgumentIndex + 1] : null;
const files = args.filter((argument, index) => (
  argument !== '--compact'
  && argument !== '--summary-only'
  && argument !== '--sheet'
  && index !== sheetArgumentIndex + 1
));

if (!files.length) {
  console.error('Usage: node scripts/inspect-historical-incidents.js [--summary-only] [--compact] [--sheet "Sheet Name"] <workbook.xlsx> [...]');
  process.exit(1);
}

const displayValue = (cell) => {
  const value = cell.value;
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
  if (value.formula || value.sharedFormula) {
    return { formula: value.formula || value.sharedFormula, result: value.result ?? null };
  }
  if (value.text != null) return value.text;
  if (value.error != null) return value.error;
  return value;
};

const compactValue = (value) => {
  if (!compact || typeof value !== 'string') return value;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
};

const inspectSheet = (sheet) => {
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = 0;
  let minColumn = Number.POSITIVE_INFINITY;
  let maxColumn = 0;
  let nonEmptyCells = 0;
  let formulaCells = 0;
  let dateCells = 0;
  let hiddenRows = 0;
  let hiddenColumns = 0;
  const populatedRows = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = [];
    let rowHasData = false;
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const rendered = displayValue(cell);
      if (rendered == null || rendered === '') return;
      rowHasData = true;
      nonEmptyCells += 1;
      minRow = Math.min(minRow, rowNumber);
      maxRow = Math.max(maxRow, rowNumber);
      minColumn = Math.min(minColumn, columnNumber);
      maxColumn = Math.max(maxColumn, columnNumber);
      if (cell.type === ExcelJS.ValueType.Formula || (typeof cell.value === 'object' && cell.value?.formula)) formulaCells += 1;
      if (cell.value instanceof Date) dateCells += 1;
      values[columnNumber - 1] = compactValue(rendered);
    });
    if (rowHasData) populatedRows.push({ row: rowNumber, values });
    if (row.hidden) hiddenRows += 1;
  });

  for (let columnNumber = 1; columnNumber <= Math.max(sheet.columnCount, maxColumn); columnNumber += 1) {
    if (sheet.getColumn(columnNumber).hidden) hiddenColumns += 1;
  }

  const previewHead = populatedRows.slice(0, summaryOnly ? 3 : compact ? 8 : 30);
  const previewTail = summaryOnly || compact ? [] : populatedRows.length > 30 ? populatedRows.slice(-8) : [];

  return {
    name: sheet.name,
    state: sheet.state || 'visible',
    declaredRowCount: sheet.rowCount,
    declaredColumnCount: sheet.columnCount,
    actualRowCount: sheet.actualRowCount,
    actualColumnCount: sheet.actualColumnCount,
    usedRange: maxRow ? { minRow, maxRow, minColumn, maxColumn } : null,
    populatedRowCount: populatedRows.length,
    nonEmptyCells,
    formulaCells,
    dateCells,
    mergedRangeCount: (sheet.model?.merges || []).length,
    ...(summaryOnly ? {} : { mergedRanges: sheet.model?.merges || [] }),
    hiddenRows,
    hiddenColumns,
    previewHead,
    previewTail,
  };
};

const run = async () => {
  const reports = [];
  for (const file of files) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    reports.push({
      workbook: path.basename(file),
      fullPath: path.resolve(file),
      creator: workbook.creator || null,
      created: workbook.created || null,
      modified: workbook.modified || null,
      worksheetCount: workbook.worksheets.length,
      worksheets: workbook.worksheets
        .filter((sheet) => !selectedSheet || sheet.name === selectedSheet)
        .map(inspectSheet),
    });
  }
  process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

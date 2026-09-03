'use strict';

require('dotenv').config();
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../src/database/connection');

const query = (sql, replacements = {}) => sequelize.query(sql, {
  replacements,
  type: QueryTypes.SELECT,
});

const run = async () => {
  const [totals] = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(DISTINCT source_hash) AS uniqueHashes,
      SUM(location_id IS NULL) AS missingLocation,
      SUM(department_id IS NULL) AS missingDepartment,
      MIN(incident_date) AS minDate,
      MAX(incident_date) AS maxDate
    FROM incidents
    WHERE deleted_at IS NULL AND source_type = 'historical_excel_import'
  `);
  const byType = await query(`
    SELECT incident_type AS incidentType, COUNT(*) AS count
    FROM incidents
    WHERE deleted_at IS NULL AND source_type = 'historical_excel_import'
    GROUP BY incident_type
    ORDER BY incident_type
  `);
  const byStatus = await query(`
    SELECT status, COUNT(*) AS count
    FROM incidents
    WHERE deleted_at IS NULL AND source_type = 'historical_excel_import'
    GROUP BY status
    ORDER BY status
  `);
  const byYear = await query(`
    SELECT YEAR(incident_date) AS year, COUNT(*) AS count
    FROM incidents
    WHERE deleted_at IS NULL AND source_type = 'historical_excel_import'
    GROUP BY YEAR(incident_date)
    ORDER BY year
  `);
  const byDepartment = await query(`
    SELECT COALESCE(d.code, d.name) AS department, COUNT(*) AS count
    FROM incidents i
    JOIN departments d ON d.id = i.department_id
    WHERE i.deleted_at IS NULL AND i.source_type = 'historical_excel_import'
    GROUP BY COALESCE(d.code, d.name)
    ORDER BY department
  `);
  const [injuries] = await query(`
    SELECT COUNT(*) AS total, COUNT(DISTINCT ii.incident_id) AS incidentCount
    FROM incident_injuries ii
    JOIN incidents i ON i.id = ii.incident_id
    WHERE i.deleted_at IS NULL AND i.source_type = 'historical_excel_import'
  `);
  const [duplicateNumbers] = await query(`
    SELECT COUNT(*) AS groupsFound FROM (
      SELECT incident_number FROM incidents
      WHERE deleted_at IS NULL
      GROUP BY incident_number HAVING COUNT(*) > 1
    ) duplicates
  `);
  const [dateMismatch] = await query(`
    SELECT COUNT(*) AS count
    FROM incidents
    WHERE deleted_at IS NULL
      AND source_type = 'historical_excel_import'
      AND JSON_EXTRACT(metadata, '$.date_description_mismatch') = true
  `);
  const sample = await query(`
    SELECT i.id, i.incident_number AS incidentNumber, i.incident_date AS incidentDate,
           i.incident_type AS incidentType, i.location,
           COALESCE(d.code, d.name) AS department,
           l.name AS masterLocation, i.source_workbook AS sourceWorkbook,
           i.source_sheet AS sourceSheet, i.source_row AS sourceRow
    FROM incidents i
    JOIN departments d ON d.id = i.department_id
    JOIN locations l ON l.id = i.location_id
    WHERE i.deleted_at IS NULL AND i.source_type = 'historical_excel_import'
    ORDER BY i.incident_date, i.incident_number
    LIMIT 3
  `);
  const orderedSourceDates = await query(`
    SELECT source_sheet AS sourceSheet,
           CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.source_event_serial')) AS UNSIGNED) AS serial,
           incident_date AS incidentDate
    FROM incidents
    WHERE deleted_at IS NULL AND source_type = 'historical_excel_import'
    ORDER BY source_sheet, serial
  `);
  const dateSequenceRegressions = [];
  const previousBySheet = new Map();
  for (const row of orderedSourceDates) {
    const previous = previousBySheet.get(row.sourceSheet);
    if (previous && String(row.incidentDate) < String(previous.incidentDate)) {
      dateSequenceRegressions.push({ previous, current: row });
    }
    previousBySheet.set(row.sourceSheet, row);
  }

  const typeCounts = Object.fromEntries(byType.map((row) => [row.incidentType, Number(row.count)]));
  const assertions = {
    totalIs166: Number(totals.total) === 166,
    sourceHashesAreUnique: Number(totals.uniqueHashes) === 166,
    allDepartmentsLinked: Number(totals.missingDepartment) === 0,
    allLocationsLinked: Number(totals.missingLocation) === 0,
    injuryRowsAreOnePerInjuryIncident: Number(injuries.total) === 108 && Number(injuries.incidentCount) === 108,
    expectedClassifications: typeCounts.first_aid === 78
      && typeCounts.mtc === 11
      && typeCounts.lti === 19
      && typeCounts.fire === 58,
    noDuplicateIncidentNumbers: Number(duplicateNumbers.groupsFound) === 0,
    documentedDateMismatchPreserved: Number(dateMismatch.count) === 1,
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const report = {
    assertions,
    failedAssertions,
    totals,
    byType,
    byStatus,
    byYear,
    byDepartment,
    injuries,
    dateSequenceRegressions,
    sample,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (failedAssertions.length) process.exitCode = 1;
};

run()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());

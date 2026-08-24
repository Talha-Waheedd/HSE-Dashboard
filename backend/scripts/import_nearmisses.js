require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { sequelize } = require('../src/database/connection');
const NearMiss = require('../src/modules/incidents/near-miss.model');
const Plant = require('../src/modules/hse-foundation/plant.model');
const User = require('../src/modules/users/user.model');
const Department = require('../src/modules/hse-foundation/department.model');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Get default IDs
    const plant = await Plant.findOne();
    const user = await User.findOne();

    if (!plant || !user) {
      throw new Error('No Plant or User found in DB to use as defaults');
    }

    const defaultPlantId = plant.id;
    const defaultUserId = user.id;

    // Load Departments
    const depts = await Department.findAll();
    const deptMap = {};
    for (const d of depts) {
      deptMap[d.name.toLowerCase()] = d.id;
      if (d.code) deptMap[d.code.toLowerCase()] = d.id;
    }

    // Delete existing near misses
    await NearMiss.destroy({ where: {}, truncate: true, force: true });
    console.log('Deleted existing near miss records');

    // Parse CSV
    const csvPath = 'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\2ca2472f-9cbb-4c47-b782-e9f0501ff4af\\.user_uploaded\\media_1787391146291.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    
    // Some headers span multiple lines (like "Time \n(24 Hrs)")
    // CSV parser handles this properly if we don't manually split/slice incorrectly.
    // However, the first line is "NEAR MISS RECORD,,,,,,,,,,,,"
    // So let's skip the first line.
    const lines = fileContent.split('\n');
    const contentToParse = lines.slice(1).join('\n');

    const records = parse(contentToParse, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    console.log(`Parsed ${records.length} records from CSV`);

    const recordsToInsert = [];

    for (const r of records) {
      // Basic validation
      if (!r['Details of the Near Miss'] || r['Details of the Near Miss'].trim() === '') continue;

      let deptId = null;
      if (r['Deptt.']) {
        const dName = r['Deptt.'].toLowerCase().trim();
        deptId = deptMap[dName] || null;
      }

      // Map Date (Format DD/MM/YYYY)
      let reportedAt = new Date();
      if (r['Date']) {
        const dString = r['Date'].replace(/-/g, '/').trim();
        const parts = dString.split('/');
        if (parts.length === 3) {
          const tryDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00Z`);
          if (!isNaN(tryDate)) {
            reportedAt = tryDate;
          }
        }
      }

      // Status
      let status = 'submitted';
      if (r['Stauts (Open/Close)'] && r['Stauts (Open/Close)'].toLowerCase().includes('close')) {
        status = 'closed';
      }

      const nm = {
        reportedBy: defaultUserId,
        plantId: defaultPlantId,
        departmentId: deptId,
        title: r['Details of the Near Miss'].substring(0, 150),
        description: r['Details of the Near Miss'],
        location: r['Area / Location'] || '',
        severityLevel: 'medium', // Default
        status: status,
        immediateAction: r['Preventive Action Suggestion'] || '',
        reportedAt: reportedAt,
        metadata: {
          s_no: r['S#'],
          month: r['Month'],
          reported_by_name: r['Reported By'],
          reported_by_desig: r['Desig.'],
          affected_person_name: r['Affected Person Name'],
          affected_person_desig: r['Desig.'], // Duplicated header, might be handled by csv-parse as Desig._1
          time: r['Time \n(24 Hrs)'] || r['Time \r\n(24 Hrs)'] || r['Time (24 Hrs)'] || '',
          resp: r['Resp.'],
          further_investigation: r['Further Investigation Required (Y/N)'],
          reported_in_hazard: r['Reported in HAZARD (Y/N)'],
          remarks: r['Remarks'] || ''
        }
      };

      recordsToInsert.push(nm);
    }

    // Bulk insert in chunks
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
      const chunk = recordsToInsert.slice(i, i + chunkSize);
      await NearMiss.bulkCreate(chunk);
      inserted += chunk.length;
      console.log(`Inserted ${inserted}/${recordsToInsert.length} records`);
    }

    console.log('Successfully uploaded all near miss records');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

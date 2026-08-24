require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { sequelize } = require('../src/database/connection');
const Hazard = require('../src/modules/hazards/hazard.model');
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

    // Parse CSV
    const csvPath = 'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\2ca2472f-9cbb-4c47-b782-e9f0501ff4af\\.user_uploaded\\media_1787389380714.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    
    const lines = fileContent.split('\n');
    // Skip the first line
    const contentToParse = lines.slice(1).join('\n');

    const records = parse(contentToParse, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    console.log(`Parsed ${records.length} records from CSV`);

    const hazardsToInsert = [];

    for (const r of records) {
      // Basic validation
      if (!r['Hazards Description'] || r['Hazards Description'].trim() === '') continue;

      let deptId = null;
      if (r['Originated Deptt.']) {
        const dName = r['Originated Deptt.'].toLowerCase().trim();
        deptId = deptMap[dName] || null;
      }

      // Map Date (Format DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY)
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

      // Determine severity (Default to medium)
      let severity = 'medium';
      if (r['Risk Rating']) {
        const rating = r['Risk Rating'].toLowerCase().trim();
        if (['low', 'medium', 'high', 'critical'].includes(rating)) {
          severity = rating;
        } else if (rating === 'high ') {
          severity = 'high';
        } else if (rating === 'low ') {
          severity = 'low';
        }
      }

      const hazard = {
        reportedBy: defaultUserId,
        plantId: defaultPlantId,
        departmentId: deptId,
        category: 'other', // default
        severityLevel: severity,
        title: r['Hazards Description'].substring(0, 200),
        description: r['Hazards Description'],
        location: r['Location'] || '',
        status: 'submitted',
        reportedAt: reportedAt,
        metadata: {
          s_no: r['S#'],
          originator: r['Originator Name'],
          originated_dept: r['Originated Deptt.'],
          responsible: r['RESP.'],
          unsafe_type: r['Unsafe'],
          remarks: r['Remarks'] || '',
          type: r['type'] || ''
        }
      };

      hazardsToInsert.push(hazard);
    }

    // Delete existing hazards
    await Hazard.destroy({ where: {}, truncate: true, force: true });
    console.log('Deleted existing hazard records');

    // Bulk insert in chunks
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < hazardsToInsert.length; i += chunkSize) {
      const chunk = hazardsToInsert.slice(i, i + chunkSize);
      await Hazard.bulkCreate(chunk);
      inserted += chunk.length;
      console.log(`Inserted ${inserted}/${hazardsToInsert.length} records`);
    }

    console.log('Successfully uploaded all records');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

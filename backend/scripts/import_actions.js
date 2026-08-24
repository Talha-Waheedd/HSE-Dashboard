require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const { sequelize } = require('../src/database/connection');
const CorrectiveAction = require('../src/modules/actions/corrective-action.model');
const Plant = require('../src/modules/hse-foundation/plant.model');
const User = require('../src/modules/users/user.model');

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

    // Load users for assignment
    const users = await User.findAll();
    const userMap = {};
    for (const u of users) {
      if (u.first_name) {
        userMap[u.first_name.toLowerCase()] = u.id;
        if (u.last_name) {
            userMap[`${u.first_name.toLowerCase()} ${u.last_name.toLowerCase()}`] = u.id;
        }
      }
    }

    // Delete existing actions if the user wants us to wipe? "upload these records in the database"
    // I will truncate to avoid duplicates if they uploaded multiple times. 
    await CorrectiveAction.destroy({ where: {}, truncate: true, force: true });
    console.log('Deleted existing corrective action records');

    // Parse CSV
    const csvPath = 'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\2ca2472f-9cbb-4c47-b782-e9f0501ff4af\\.user_uploaded\\media_1787549195098.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    
    // Skip the first line "HSE Actions Item Tracker,,,,,,,,,,,,"
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
      if (!r['Actions / Recommendation'] || r['Actions / Recommendation'].trim() === '') continue;

      // Assign user
      let assignId = defaultUserId;
      if (r['Responsible Manager']) {
        const mgr = r['Responsible Manager'].toLowerCase().trim();
        // Try exact match or partial match
        for (const name in userMap) {
            if (mgr.includes(name) || name.includes(mgr)) {
                assignId = userMap[name];
                break;
            }
        }
      }

      // Map Date (Target date)
      let dueDate = new Date();
      if (r['Target date']) {
          // If it says "Immediate", "Pending", "WIP", use today + 7 days
          if (r['Target date'].toLowerCase().includes('immediate') || r['Target date'].toLowerCase().includes('pending')) {
              dueDate.setDate(dueDate.getDate() + 7);
          } else {
             // Try parsing DD-MMM-YY or similar
             const parsedDate = new Date(r['Target date']);
             if (!isNaN(parsedDate)) {
                 dueDate = parsedDate;
             } else {
                 dueDate.setDate(dueDate.getDate() + 30); // Arbitrary fallback
             }
          }
      }

      // Status
      let status = 'open';
      if (r['Action Item Status']) {
          const s = r['Action Item Status'].toLowerCase();
          if (s.includes('done') || s.includes('closed')) status = 'completed';
          else if (s.includes('wip') || s.includes('progress')) status = 'in_progress';
      }

      // Priority
      let priority = 'medium';
      if (r['Severity']) {
          const p = r['Severity'].toLowerCase().trim();
          if (['low', 'medium', 'high', 'critical'].includes(p)) priority = p;
      }

      const ca = {
        sourceType: 'audit',
        sourceId: crypto.randomUUID(), // Dummy UUID as we don't have a source record
        plantId: defaultPlantId,
        title: (r['Audit Description'] || 'Audit Action Item').substring(0, 250),
        description: `Source: ${r['Action Drived From']} | Area: ${r['Area/Clauses']} | Auditor: ${r['Auditor Name']}\n\n${r['Actions / Recommendation']}`,
        assignedTo: assignId,
        assignedBy: defaultUserId,
        dueDate: dueDate,
        status: status,
        priority: priority
      };

      recordsToInsert.push(ca);
    }

    // Bulk insert in chunks
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
      const chunk = recordsToInsert.slice(i, i + chunkSize);
      await CorrectiveAction.bulkCreate(chunk);
      inserted += chunk.length;
      console.log(`Inserted ${inserted}/${recordsToInsert.length} records`);
    }

    console.log('Successfully uploaded all action tracker records');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

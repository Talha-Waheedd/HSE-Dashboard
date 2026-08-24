require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const { sequelize } = require('../src/database/connection');
const HseAudit = require('../src/modules/audits/audit.model');
const Plant = require('../src/modules/hse-foundation/plant.model');
const User = require('../src/modules/users/user.model');
const Department = require('../src/modules/hse-foundation/department.model');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const plant = await Plant.findOne();
    const user = await User.findOne();
    if (!plant || !user) throw new Error('No Plant or User found in DB to use as defaults');

    const defaultPlantId = plant.id;
    const defaultUserId = user.id;

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

    const csvPath = 'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\2ca2472f-9cbb-4c47-b782-e9f0501ff4af\\.user_uploaded\\media_1787549858169.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    
    // Skip the first line
    const lines = fileContent.split('\n');
    const contentToParse = lines.slice(1).join('\n');

    const records = parse(contentToParse, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    console.log(`Parsed ${records.length} records from CSV`);

    const auditsToInsert = [];
    let auditNumberCounter = Date.now() % 10000;

    for (const r of records) {
      if (!r['Area Name']) continue;

      let assignId = defaultUserId;
      if (r['Auditors']) {
        const mgr = r['Auditors'].toLowerCase().trim();
        for (const name in userMap) {
            if (mgr.includes(name)) {
                assignId = userMap[name];
                break;
            }
        }
      }

      const months = [
          { col: 'May-26', year: 2026, month: 5 },
          { col: 'Jun-26', year: 2026, month: 6 },
          { col: 'Jul-26', year: 2026, month: 7 },
          { col: 'Aug-26', year: 2026, month: 8 },
          { col: 'Sept-26', year: 2026, month: 9 },
          { col: 'Oct-26', year: 2026, month: 10 },
          { col: 'Nov-26', year: 2026, month: 11 },
          { col: 'Dec-26', year: 2026, month: 12 },
          { col: 'Jan-27', year: 2027, month: 1 },
          { col: 'Feb-27', year: 2027, month: 2 },
          { col: 'Mar-27', year: 2027, month: 3 },
          { col: 'Apr-27', year: 2027, month: 4 },
          { col: 'May-27', year: 2027, month: 5 }
      ];

      for (const m of months) {
          const val = (r[m.col] || '').trim();
          if (val && val !== '_' && val !== '') {
              // Extract day if possible
              let day = 1;
              const match = val.match(/(\d+)/);
              if (match) {
                  day = parseInt(match[1], 10);
                  if (day > 28) day = 28;
              }

              const schedDate = new Date(Date.UTC(m.year, m.month - 1, day));
              
              let st = 'planned';
              const rawStat = (r['Status'] || '').toLowerCase();
              if (rawStat === 'done') st = 'completed';
              else if (rawStat === 'wip' || rawStat === 'in progress') st = 'in_progress';
              
              const aud = {
                  plantId: defaultPlantId,
                  departmentId: null,
                  auditNumber: `AUD-${schedDate.getFullYear()}-${String(auditNumberCounter++).padStart(4, '0')}`,
                  title: r['Area Name'].substring(0, 250),
                  auditType: 'internal',
                  status: st,
                  auditedBy: assignId,
                  scheduledDate: schedDate,
                  scope: r['Audit Objective\n (Aligned with HSE Standards)'] || r['Audit Objective (Aligned with HSE Standards)'] || '',
                  summary: `Frequency: ${r['Frequency']} | Risk Rating: ${r['Risk Rating']} | Owners: ${r['Area Owners']}`
              };
              auditsToInsert.push(aud);
          }
      }
    }

    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < auditsToInsert.length; i += chunkSize) {
      const chunk = auditsToInsert.slice(i, i + chunkSize);
      await HseAudit.bulkCreate(chunk);
      inserted += chunk.length;
      console.log(`Inserted ${inserted}/${auditsToInsert.length} records`);
    }

    console.log('Successfully uploaded all audit records');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

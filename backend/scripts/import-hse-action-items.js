'use strict';

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const crypto = require('crypto');
const { HseActionItem } = require('../src/database/models'); // Or map it directly if models isn't fully set up

// Let's connect directly to Sequelize to ensure it works without typical app initialization overhead
const { sequelize } = require('../src/database/connection');
const HseActionItemModel = require('../src/modules/hse-action-items/hse-action-item.model');

// Custom date parser
function parseDateText(dateText) {
  if (!dateText) return null;
  // If it's a range like "4/11/2024 to 8/11/2024", take the first part
  let text = dateText.split('to')[0].trim();
  
  // Try DD-MMM-YY e.g., "03-May-25"
  const parts1 = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (parts1) {
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const d = parseInt(parts1[1], 10);
    const m = months[parts1[2]];
    const y = 2000 + parseInt(parts1[3], 10);
    if (m !== undefined) {
      return new Date(Date.UTC(y, m, d)).toISOString().split('T')[0];
    }
  }
  
  // Try DD/MM/YYYY or MM/DD/YYYY. Based on observations "06/01/2025,June" -> DD/MM/YYYY
  const parts2 = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts2) {
    const d = parseInt(parts2[1], 10);
    const m = parseInt(parts2[2], 10) - 1;
    const y = parseInt(parts2[3], 10);
    return new Date(Date.UTC(y, m, d)).toISOString().split('T')[0];
  }
  
  return null;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    const results = [];
    const filePath = path.join(__dirname, 'data', 'hse-actions.csv');
    
    // The first row is "HSE Actions Item Tracker,,,,,,,,,,,,,", so we need to skip it.
    // We'll read the file, drop the first line, and pipe to csv-parser.
    let fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    if (lines[0] && lines[0].includes('HSE Actions Item Tracker')) {
      lines.shift();
    }
    
    // Re-join and parse
    const requireFromString = require('stream').Readable.from([lines.join('\n')]);
    
    requireFromString
      .pipe(csv())
      .on('data', (data) => {
        // Skip empty rows
        if (!data['Sr. #'] && !data['Date'] && !data['Auditor Name']) return;

        const dateText = data['Date'] ? data['Date'].trim() : null;
        const targetDateText = data['Target date'] ? data['Target date'].trim() : null;
        
        const date = parseDateText(dateText);
        const targetDate = parseDateText(targetDateText);

        const auditorName = data['Auditor Name'] ? data['Auditor Name'].trim() : null;
        const actionDerivedFrom = data['Action Drived From'] ? data['Action Drived From'].trim() : null;
        const auditDescription = data['Audit Description'] ? data['Audit Description'].trim() : null;
        const recommendation = data['Actions / Recommendation'] ? data['Actions / Recommendation'].trim() : null;
        const responsibleDepartment = data['Responsible Department'] ? data['Responsible Department'].trim() : null;

        // Generate source hash for deduplication
        const hashInput = `${dateText || ''}|${auditorName || ''}|${auditDescription || ''}|${recommendation || ''}|${responsibleDepartment || ''}`;
        const sourceHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        results.push({
          sourceHash,
          srNo: data['Sr. #'] ? data['Sr. #'].trim() : null,
          dateText,
          date,
          month: data['Month'] ? data['Month'].trim() : null,
          auditorName,
          actionDerivedFrom,
          auditDescription,
          areaClauses: data['Area/Clauses'] ? data['Area/Clauses'].trim() : null,
          recommendation,
          severity: data['Severity'] ? data['Severity'].trim() : null,
          responsibleDepartment,
          responsibleManager: data['Responsible Manager'] ? data['Responsible Manager'].trim() : null,
          targetDateText,
          targetDate,
          status: data['Action Item Status'] ? data['Action Item Status'].trim() : null,
        });
      })
      .on('end', async () => {
        console.log(`Parsed ${results.length} rows from CSV.`);
        
        let imported = 0;
        let skipped = 0;
        
        // Use bulkCreate with ignoreDuplicates (if MySQL supports it, which it does via updateOnDuplicate)
        // Alternatively, since we want to be safe, we'll insert them one by one or in chunks
        for (const item of results) {
          try {
            await HseActionItemModel.findOrCreate({
              where: { sourceHash: item.sourceHash },
              defaults: item,
            });
            imported++;
          } catch (err) {
            console.error(`Failed to import row Sr. # ${item.srNo}: ${err.message}`);
          }
        }
        
        console.log(`Import summary: ${imported} imported, ${results.length - imported} skipped/failed.`);
        process.exit(0);
      });
  } catch (err) {
    console.error('Import error:', err);
    process.exit(1);
  }
}

run();

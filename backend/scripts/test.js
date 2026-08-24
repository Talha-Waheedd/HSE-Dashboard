require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvPath = 'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\2ca2472f-9cbb-4c47-b782-e9f0501ff4af\\.user_uploaded\\media_1787389380714.csv';
const fileContent = fs.readFileSync(csvPath, 'utf8');

const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true
});

console.log(Object.keys(records[0]));

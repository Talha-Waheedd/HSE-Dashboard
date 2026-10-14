const fs = require('fs');
const { sequelize } = require('./src/database/connection');
const Employee = require('./src/modules/hse-foundation/employee.model');
const User = require('./src/modules/users/user.model');
const Department = require('./src/modules/hse-foundation/department.model');

const files = [
  'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\18d76bd8-ad73-4357-a6a2-81f17f2422de\\.user_uploaded\\media_1791620307654.csv',
  'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\18d76bd8-ad73-4357-a6a2-81f17f2422de\\.user_uploaded\\media_1791620315207.csv',
  'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\18d76bd8-ad73-4357-a6a2-81f17f2422de\\.user_uploaded\\media_1791620315225.csv'
];

async function run() {
  const allRecords = [];
  files.forEach(f => {
    const lines = fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      const h = lines[0].split(',').map(x => x.trim());
      for (let i = 1; i < lines.length; i++) {
        const v = lines[i].split(',').map(x => x.trim());
        const rec = {};
        h.forEach((key, idx) => rec[key] = v[idx]);
        allRecords.push(rec);
      }
    }
  });

  const empNoSet = new Set(allRecords.map(r => r['Emp No']));

  const users = await User.findAll();
  const employees = await Employee.findAll();
  users.forEach(u => u.employeeProfile = employees.find(e => e.userId === u.id));

  console.log('Total users with employeeProfile:', users.filter(u => u.employeeProfile).length);

  // Check which employees are NOT in CSV
  const notInCsv = users.filter(u => u.employeeProfile && !empNoSet.has(u.employeeProfile.employeeId));
  console.log('\nEmployees not in CSV (Dummy Candidates):');
  notInCsv.forEach(u => console.log(`- ${u.firstName} ${u.lastName} (ID: ${u.employeeProfile.employeeId}, Email: ${u.email})`));

  // Check for missing departments
  const noDept = users.filter(u => u.employeeProfile && empNoSet.has(u.employeeProfile.employeeId) && !u.employeeProfile.departmentId);
  console.log(`\nCSV Employees missing department_id (${noDept.length}):`);
  if (noDept.length > 0) {
    noDept.slice(0, 10).forEach(u => console.log(`- ${u.firstName} ${u.lastName} (ID: ${u.employeeProfile.employeeId})`));
  }

  // Print raw department strings from CSV for those missing
  if (noDept.length > 0) {
    console.log('\nDepartments in CSV that failed to map:');
    const missingDepts = new Set();
    noDept.forEach(u => {
      const rec = allRecords.find(r => r['Emp No'] === u.employeeProfile.employeeId);
      if (rec) missingDepts.add(rec['Department']);
    });
    console.log(Array.from(missingDepts).join(', '));
  }

  // List all departments in DB
  const depts = await Department.findAll();
  console.log('\nDepartments in DB:');
  console.log(depts.map(d => `${d.name} (${d.code})`).join(', '));

  process.exit(0);
}
run();

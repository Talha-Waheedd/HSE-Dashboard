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

  const departments = await Department.findAll();
  const getDeptId = (deptName) => {
    if (!deptName) return null;
    const lower = deptName.toLowerCase().trim();
    const d = departments.find(d => 
      (d.name || '').toLowerCase().trim() === lower || 
      (d.code || '').toLowerCase().trim() === lower ||
      (d.name || '').toLowerCase().includes(lower) ||
      lower.includes((d.name || '').toLowerCase())
    );
    return d ? d.id : null;
  };

  const users = await User.findAll();
  const employees = await Employee.findAll();
  users.forEach(u => u.employeeProfile = employees.find(e => e.userId === u.id));

  let updated = 0;
  for (const rec of allRecords) {
    const empNo = rec['Emp No'];
    const deptId = getDeptId(rec['Department']);
    
    if (deptId) {
      const user = users.find(u => u.employeeProfile && u.employeeProfile.employeeId === empNo);
      if (user && user.employeeProfile) {
        if (user.employeeProfile.departmentId !== deptId) {
          await user.employeeProfile.update({ departmentId: deptId });
          updated++;
        }
      }
    }
  }

  console.log(`Updated department for ${updated} employees.`);
  process.exit(0);
}
run();

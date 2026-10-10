const fs = require('fs');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const { sequelize } = require('./src/database/connection');
const Employee = require('./src/modules/hse-foundation/employee.model');
const User = require('./src/modules/users/user.model');
const Department = require('./src/modules/hse-foundation/department.model');
const Role = require('./src/modules/users/role.model');
const bcrypt = require('bcryptjs');

const files = [
  'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\18d76bd8-ad73-4357-a6a2-81f17f2422de\\.user_uploaded\\media_1791620307654.csv',
  'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\18d76bd8-ad73-4357-a6a2-81f17f2422de\\.user_uploaded\\media_1791620315207.csv',
  'C:\\Users\\talha\\.gemini\\antigravity-ide\\brain\\18d76bd8-ad73-4357-a6a2-81f17f2422de\\.user_uploaded\\media_1791620315225.csv'
];

async function run() {
  let allRecords = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const record = {};
        headers.forEach((h, idx) => {
          record[h] = values[idx];
        });
        allRecords.push(record);
      }
    }
  });

  // Check for duplicates in CSV
  const empNoMap = new Map();
  const duplicates = [];
  for (const rec of allRecords) {
    const empNo = rec['Emp No'];
    if (empNoMap.has(empNo)) {
      duplicates.push(empNo);
    } else {
      empNoMap.set(empNo, rec);
    }
  }

  console.log(`Parsed ${allRecords.length} records. Found ${duplicates.length} duplicates in CSV.`);

  const departments = await Department.findAll();
  const getDeptId = (deptName) => {
    if (!deptName) return null;
    const lower = deptName.toLowerCase().trim();
    // Special handling if needed based on typical mismatches
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
  
  // map employees to users
  users.forEach(u => {
    u.employeeProfile = employees.find(e => e.userId === u.id);
  });
  


  // Identify dummy users BEFORE import
  const dummyKeywords = ['test', 'dummy'];
  const toDelete = [];
  const toReview = [];
  
  for (const user of users) {
    const isEmp = user.employeeProfile && user.employeeProfile.employeeId;
    const empId = user.employeeProfile ? user.employeeProfile.employeeId : null;
    const email = user.email.toLowerCase();
    const name = `${user.firstName} ${user.lastName}`.toLowerCase();
    
    // Explicitly delete Ahmed (101), Roshni (102), Talha (103)
    if (empId === '101' || empId === '102' || empId === '103' || email.endsWith('@cblapp.com')) {
      toDelete.push(user);
    } else if (dummyKeywords.some(k => name.includes(k) || email.includes(k) || (empId && empId.toLowerCase().includes(k)))) {
      if (!email.includes('admin') && !email.includes('super')) {
        toDelete.push(user);
      } else {
        toReview.push(user);
      }
    } else if (isEmp && !empNoMap.has(empId)) {
      if (!email.includes('admin') && !email.includes('super')) {
        toReview.push(user);
      }
    }
  }

  console.log(`Deleting ${toDelete.length} dummy users...`);
  for (const user of toDelete) {
    if (user.employeeProfile) {
      await user.employeeProfile.destroy();
    }
    await user.destroy();
  }
  
  // Reload users after deletion
  const activeUsers = await User.findAll();
  const activeEmployees = await Employee.findAll();
  activeUsers.forEach(u => {
    u.employeeProfile = activeEmployees.find(e => e.userId === u.id);
  });

  let updated = 0;
  let created = 0;
  
  const plantIdRes = await sequelize.query('SELECT id FROM plants LIMIT 1');
  const plantId = plantIdRes[0].length > 0 ? plantIdRes[0][0].id : null;
  
  const roleRes = await Role.findOne({ where: { name: 'Employee' } });
  const roleId = roleRes ? roleRes.id : null;

  for (const empNo of empNoMap.keys()) {
    const rec = empNoMap.get(empNo);
    const deptId = getDeptId(rec['Department']);
    
    // Split name
    const rawName = rec['Emp Name'].replace(/^Mr\.\s*/i, '').replace(/^Ms\.\s*/i, '').replace(/\.$/, '').trim();
    const parts = rawName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '.';
    
    const existingUser = activeUsers.find(u => u.employeeProfile && u.employeeProfile.employeeId === empNo);
    
    if (existingUser) {
      await existingUser.employeeProfile.update({
        departmentId: deptId || existingUser.employeeProfile.departmentId,
        designation: rec['Designation'],
      });
      await existingUser.update({
        firstName: firstName,
        lastName: lastName
      });
      updated++;
    } else {
      const email = `${empNo}@cbl.com`.toLowerCase();
      const newUser = await User.create({
        id: uuidv4(),
        firstName,
        lastName,
        email,
        password: await bcrypt.hash('CBL@1234', 10),
        roleId,
        isActive: true,
      });
      
      await Employee.create({
        id: uuidv4(),
        userId: newUser.id,
        employeeId: empNo,
        departmentId: deptId,
        designation: rec['Designation'],
        plantId
      });
      created++;
    }
  }

  console.log(`\nResults:`);
  console.log(`Deleted Dummy Users: ${toDelete.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Duplicates in CSV: ${duplicates.length > 0 ? duplicates.join(', ') : 'None'}`);
  
  console.log(`\nUsers left for REVIEW (${toReview.length}):`);
  toReview.forEach(u => console.log(`- ${u.firstName} ${u.lastName} (${u.email}, EmpID: ${u.employeeProfile?.employeeId || 'None'})`));
  
  process.exit(0);
}

run().catch(console.error);

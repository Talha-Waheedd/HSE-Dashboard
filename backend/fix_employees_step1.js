const { sequelize } = require('./src/database/connection');
const Employee = require('./src/modules/hse-foundation/employee.model');
const User = require('./src/modules/users/user.model');
const Department = require('./src/modules/hse-foundation/department.model');
const { v4: uuidv4 } = require('uuid');

async function run() {
  // Delete 104 and 105
  const dummyIds = ['104', '105'];
  const users = await User.findAll();
  const employees = await Employee.findAll();
  users.forEach(u => u.employeeProfile = employees.find(e => e.userId === u.id));
  const toDelete = users.filter(u => u.employeeProfile && dummyIds.includes(u.employeeProfile.employeeId));
  
  for (const user of toDelete) {
    if (user.employeeProfile) await user.employeeProfile.destroy();
    await user.destroy();
    console.log(`Deleted dummy user ${user.firstName} ${user.lastName} (ID: ${user.employeeProfile.employeeId})`);
  }

  const plantIdRes = await sequelize.query('SELECT id FROM plants LIMIT 1');
  const plantId = plantIdRes[0].length > 0 ? plantIdRes[0][0].id : null;

  const missingDepts = ['Engineering', 'Finance', 'CI', 'Plant Management'];
  for (const deptName of missingDepts) {
    let dept = await Department.findOne({ where: { name: deptName } });
    if (!dept) {
      dept = await Department.create({
        id: require('crypto').randomUUID(),
        name: deptName,
        code: deptName.toUpperCase().replace(/\s+/g, '_').substring(0, 10),
        isActive: true,
        plantId
      });
      console.log(`Created missing department: ${deptName}`);
    }
  }

  process.exit(0);
}

run();

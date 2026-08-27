const { User, Employee } = require('./src/database/models.js');

async function check() {
  const users = await User.findAll({ where: { email: ['ahmed@cblapp.com', 'roshni@cblapp.com', 'talha@cblapp.com'] } });
  console.log("Users:", users.map(u => u.toJSON()));
  const employees = await Employee.findAll({ where: { employeeId: ['101', '102', '103'] } });
  console.log("Employees:", employees.map(e => e.toJSON()));
  process.exit(0);
}
check().catch(console.error);

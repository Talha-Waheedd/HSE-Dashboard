const { sequelize } = require('./src/database/connection');
const User = require('./src/modules/users/user.model');
const Employee = require('./src/modules/hse-foundation/employee.model');
const Role = require('./src/modules/users/role.model');

async function seed() {
  try {
    const role = await Role.findOne({ where: { name: 'system_administrator' } });
    const user = await User.create({
      firstName: 'Saad',
      lastName: 'Noor',
      email: 'saad.noor@cblapp.com',
      password: 'password123',
      roleId: role ? role.id : null,
      status: true
    });

    const emp = await Employee.create({
      userId: user.id,
      employeeId: '101',
      departmentId: 'a6e1ca7f-9988-4757-b4b9-c35ef7e76956', // Production
      plantId: '44bd548d-0e22-40ba-a8e6-c037931c2a63', // Sukkur
      designation: 'intern',
      employmentType: 'intern',
      gender: 'Male'
    });

    console.log('Successfully created employee:', emp.toJSON());
  } catch (error) {
    console.error('Error creating employee:', error);
  } finally {
    process.exit(0);
  }
}

seed();

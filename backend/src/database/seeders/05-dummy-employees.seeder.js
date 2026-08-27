'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // We need 3 users first
    const users = [
      {
        id: uuidv4(),
        first_name: 'Ahmed',
        last_name: 'Employee',
        email: 'ahmed@cblapp.com',
        created_at: new Date(),
        updated_at: new Date(),
        status: true
      },
      {
        id: uuidv4(),
        first_name: 'Roshni',
        last_name: 'Employee',
        email: 'roshni@cblapp.com',
        created_at: new Date(),
        updated_at: new Date(),
        status: true
      },
      {
        id: uuidv4(),
        first_name: 'Talha',
        last_name: 'Employee',
        email: 'talha@cblapp.com',
        created_at: new Date(),
        updated_at: new Date(),
        status: true
      }
    ];

    await queryInterface.bulkDelete('employees', { employee_id: ['101', '102', '103'] }, {});
    await queryInterface.bulkDelete('users', { email: ['ahmed@cblapp.com', 'roshni@cblapp.com', 'talha@cblapp.com'] }, {});

    await queryInterface.bulkInsert('users', users, {});

    // Now insert corresponding employees
    const employees = [
      {
        id: uuidv4(),
        user_id: users[0].id,
        employee_id: '101',
        designation: 'Software Engineer',
        gender: 'Male',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[1].id,
        employee_id: '102',
        designation: 'QA Engineer',
        gender: 'Female',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[2].id,
        employee_id: '103',
        designation: 'Project Manager',
        gender: 'Male',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('employees', employees, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employees', { employee_id: ['101', '102', '103'] }, {});
    await queryInterface.bulkDelete('users', { email: ['ahmed@cblapp.com', 'roshni@cblapp.com', 'talha@cblapp.com'] }, {});
  }
};

'use strict';

/**
 * Link only the development dummy employees to the existing department
 * master records. The email guard prevents this test-data migration from
 * changing unrelated production employees that happen to use the same IDs.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const departments = await queryInterface.sequelize.query(
        "SELECT id, name FROM departments WHERE name IN ('ADM', 'ESD', 'IT')",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      const departmentIds = Object.fromEntries(departments.map(department => [department.name, department.id]));
      const missing = ['ADM', 'ESD', 'IT'].filter(name => !departmentIds[name]);
      // A clean deployment runs every migration before master-data seeding.
      // This migration only repairs optional legacy development accounts, so
      // an empty departments table is a valid no-op rather than a schema
      // migration failure.
      if (missing.length > 0) return;

      const employees = await queryInterface.sequelize.query(
        `SELECT e.employee_id, u.email
         FROM employees e
         INNER JOIN users u ON u.id = e.user_id
         WHERE e.employee_id IN ('101', '102', '103')
           AND u.email IN ('ahmed@cblapp.com', 'roshni@cblapp.com', 'talha@cblapp.com')`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      const departmentByEmployee = {
        '101': departmentIds.ADM,
        '102': departmentIds.ESD,
        '103': departmentIds.IT,
      };

      for (const employee of employees) {
        await queryInterface.bulkUpdate(
          'employees',
          { department_id: departmentByEmployee[employee.employee_id], updated_at: new Date() },
          { employee_id: employee.employee_id },
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const departments = await queryInterface.sequelize.query(
        "SELECT id, name FROM departments WHERE name IN ('ADM', 'ESD', 'IT')",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      const departmentIds = Object.fromEntries(departments.map(department => [department.name, department.id]));
      const expected = {
        '101': departmentIds.ADM,
        '102': departmentIds.ESD,
        '103': departmentIds.IT,
      };

      for (const [employeeId, departmentId] of Object.entries(expected)) {
        if (!departmentId) continue;
        await queryInterface.bulkUpdate(
          'employees',
          { department_id: null, updated_at: new Date() },
          { employee_id: employeeId, department_id: departmentId },
          { transaction },
        );
      }
    });
  },
};

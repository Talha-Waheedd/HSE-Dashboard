'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('locations', 'code', { type: Sequelize.STRING(80), allowNull: true, unique: true });
    await queryInterface.addIndex('locations', ['code'], { unique: true, name: 'locations_code_unique' });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('locations', 'locations_code_unique');
    await queryInterface.removeColumn('locations', 'code');
  },
};

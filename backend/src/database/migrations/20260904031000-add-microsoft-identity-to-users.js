'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('users');
    if (!columns.microsoft_oid) {
      await queryInterface.addColumn('users', 'microsoft_oid', {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'Immutable Microsoft Entra object id (oid claim)',
      });
    }

    const indexes = await queryInterface.showIndex('users');
    if (!indexes.some((index) => index.name === 'users_microsoft_oid_unique')) {
      await queryInterface.addIndex('users', ['microsoft_oid'], {
        unique: true,
        name: 'users_microsoft_oid_unique',
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('users');
    if (!columns.microsoft_oid) return;
    const indexes = await queryInterface.showIndex('users');
    if (indexes.some((index) => index.name === 'users_microsoft_oid_unique')) {
      await queryInterface.removeIndex('users', 'users_microsoft_oid_unique');
    }
    await queryInterface.removeColumn('users', 'microsoft_oid');
  },
};

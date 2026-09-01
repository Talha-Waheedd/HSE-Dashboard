/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attachments', 'attachment_type', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'source_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attachments', 'attachment_type');
  },
};

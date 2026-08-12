'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Ensure the named Administrator role inherits exactly the permissions
 * assigned to the Industry role. This is additive and idempotent: it does
 * not grant unrelated system-administration permissions.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [administratorRows] = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE name = :name LIMIT 1',
        { replacements: { name: 'Administrator' }, transaction },
      );

      let administratorId = administratorRows[0]?.id;
      if (!administratorId) {
        administratorId = uuidv4();
        await queryInterface.bulkInsert('roles', [{
          id: administratorId,
          name: 'Administrator',
          display_name: 'Administrator',
          description: 'Full access, including all Industry capabilities',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date(),
        }], { transaction });
      }

      const [industryRows] = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE name = :name LIMIT 1',
        { replacements: { name: 'Industry' }, transaction },
      );
      const industryId = industryRows[0]?.id;
      if (!industryId) {
        throw new Error('Industry role not found; Administrator permissions were not changed.');
      }

      // Copy only Industry's permission set. Existing Administrator grants
      // remain intact, so this never removes existing Administrator access.
      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
         SELECT :administratorId, rp.permission_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM role_permissions rp
         WHERE rp.role_id = :industryId`,
        { replacements: { administratorId, industryId }, transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Permission grants are intentionally retained on rollback so an undo
  // cannot silently revoke an Administrator's existing access.
  async down() {},
};

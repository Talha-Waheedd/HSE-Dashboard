'use strict';

const { v4: uuidv4 } = require('uuid');

const NEW_PERMISSIONS = [
  {
    key: 'hazard:submit_closure',
    displayName: 'Submit Hazard Closure',
    description: 'Submit a responsible-department hazard closure for HSE review',
  },
  {
    key: 'hazard:review_closure',
    displayName: 'Review Hazard Closure',
    description: 'Approve or return a hazard closure during HSE review',
  },
];

const ROLE_GRANTS = {
  'Department Manager': [
    'hazard:view',
    'hazard:submit_closure',
    'attachment:view',
    'attachment:create',
    'hse:view_dashboard',
    'hse:view_reports',
  ],
  'HSE Manager': [
    'hazard:view',
    'hazard:update',
    'hazard:manage',
    'hazard:review_closure',
    'attachment:view',
    'attachment:create',
    'hse:view_dashboard',
    'hse:view_reports',
    'hse:manage_incidents',
  ],
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = await queryInterface.describeTable('hazards');
      if (!columns.responsible_department_id) {
        await queryInterface.addColumn('hazards', 'responsible_department_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'departments', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }, { transaction });
      }

      const hazardIndexes = await queryInterface.showIndex('hazards', { transaction });
      if (!hazardIndexes.some((index) => index.name === 'hazards_responsible_department_id_idx')) {
        await queryInterface.addIndex('hazards', ['responsible_department_id'], {
          name: 'hazards_responsible_department_id_idx',
          transaction,
        });
      }

      // Historical hazards retained the responsible department in metadata.
      // Resolve UUIDs first, then exact case/whitespace-insensitive names/codes.
      await queryInterface.sequelize.query(
        `UPDATE hazards h
         JOIN departments d
           ON d.deleted_at IS NULL
          AND (
            LOWER(d.id) = LOWER(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible_department_id')))
            OR LOWER(TRIM(d.name)) = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible_department'))))
            OR LOWER(TRIM(COALESCE(d.code, ''))) = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible_department'))))
            OR LOWER(TRIM(d.name)) = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible'))))
            OR LOWER(TRIM(COALESCE(d.code, ''))) = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible'))))
          )
         SET h.responsible_department_id = d.id
         WHERE h.responsible_department_id IS NULL`,
        { transaction },
      );

      const now = new Date();
      await queryInterface.bulkInsert('permissions', NEW_PERMISSIONS.map((permission) => ({
        id: uuidv4(),
        key: permission.key,
        display_name: permission.displayName,
        group: 'hazard',
        description: permission.description,
        created_at: now,
        updated_at: now,
      })), { ignoreDuplicates: true, transaction });

      for (const [roleName, permissionKeys] of Object.entries(ROLE_GRANTS)) {
        await queryInterface.sequelize.query(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
           SELECT r.id, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
           FROM roles r
           JOIN permissions p ON p.key IN (:permissionKeys)
           WHERE r.deleted_at IS NULL AND r.name = :roleName`,
          { replacements: { roleName, permissionKeys }, transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `DELETE rp FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE p.key IN (:permissionKeys)`,
        { replacements: { permissionKeys: NEW_PERMISSIONS.map(({ key }) => key) }, transaction },
      );
      await queryInterface.bulkDelete('permissions', {
        key: NEW_PERMISSIONS.map(({ key }) => key),
      }, { transaction });

      const columns = await queryInterface.describeTable('hazards');
      if (columns.responsible_department_id) {
        const indexes = await queryInterface.showIndex('hazards', { transaction });
        if (indexes.some((index) => index.name === 'hazards_responsible_department_id_idx')) {
          await queryInterface.removeIndex('hazards', 'hazards_responsible_department_id_idx', { transaction });
        }
        await queryInterface.removeColumn('hazards', 'responsible_department_id', { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

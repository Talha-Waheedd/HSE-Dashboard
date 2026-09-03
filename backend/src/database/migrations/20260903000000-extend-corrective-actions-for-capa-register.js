'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('corrective_actions');
    const addColumn = async (name, definition) => {
      if (!columns[name]) await queryInterface.addColumn('corrective_actions', name, definition);
    };
    await addColumn('capa_number', {
      type: Sequelize.STRING(40),
      allowNull: true,
      after: 'id',
    });
    await addColumn('source_item_id', {
      type: Sequelize.UUID,
      allowNull: true,
      after: 'source_id',
    });
    await addColumn('source_item_key', {
      type: Sequelize.STRING(80),
      allowNull: true,
      after: 'source_item_id',
    });
    await addColumn('source_reference', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'source_item_key',
    });
    await addColumn('incident_category', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'source_reference',
    });
    await addColumn('responsible_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'description',
    });
    await addColumn('responsibility', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'responsible_department_id',
    });
    await addColumn('last_synced_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'updated_by',
    });

    // Existing rows are the historical Action Tracker import. Give them stable
    // register identifiers without pretending that their old source UUIDs point
    // at current Hazard/Audit records.
    await queryInterface.sequelize.query(`
      UPDATE corrective_actions
      SET source_item_key = 'legacy',
          source_reference = COALESCE(NULLIF(title, ''), CONCAT('Legacy-', UPPER(LEFT(REPLACE(id, '-', ''), 8)))),
          incident_category = CASE source_type
            WHEN 'hazard' THEN 'Hazard'
            WHEN 'near_miss' THEN 'Near Miss'
            WHEN 'incident' THEN 'Incident'
            WHEN 'audit' THEN 'Audit Finding'
            ELSE 'Inspection'
          END,
          capa_number = CONCAT('CAPA-', YEAR(created_at), '-', UPPER(LEFT(REPLACE(id, '-', ''), 12)))
      WHERE source_item_key IS NULL
    `);

    await queryInterface.changeColumn('corrective_actions', 'capa_number', {
      type: Sequelize.STRING(40),
      allowNull: false,
    });
    await queryInterface.changeColumn('corrective_actions', 'source_item_key', {
      type: Sequelize.STRING(80),
      allowNull: false,
    });

    // Confirmed source modules do not always store a person, target date, or
    // risk. Those values must remain empty rather than being fabricated.
    await queryInterface.sequelize.query(`
      ALTER TABLE corrective_actions
        MODIFY assigned_to CHAR(36) BINARY NULL COMMENT 'Optional linked user responsible for the action',
        MODIFY assigned_by CHAR(36) BINARY NULL COMMENT 'Optional linked user who assigned the action',
        MODIFY due_date DATE NULL,
        MODIFY priority ENUM('low','medium','high','critical') NULL DEFAULT NULL
    `);

    const indexes = await queryInterface.showIndex('corrective_actions');
    const indexNames = new Set(indexes.map((index) => index.name));
    if (!indexNames.has('corrective_actions_capa_number_unique')) await queryInterface.addIndex('corrective_actions', ['capa_number'], {
      name: 'corrective_actions_capa_number_unique',
      unique: true,
    });
    if (!indexNames.has('corrective_actions_source_item_unique')) await queryInterface.addIndex('corrective_actions', ['source_type', 'source_id', 'source_item_key'], {
      name: 'corrective_actions_source_item_unique',
      unique: true,
    });
    if (!indexNames.has('corrective_actions_incident_category_idx')) await queryInterface.addIndex('corrective_actions', ['incident_category'], {
      name: 'corrective_actions_incident_category_idx',
    });
    if (!indexNames.has('corrective_actions_responsible_department_idx')) await queryInterface.addIndex('corrective_actions', ['responsible_department_id'], {
      name: 'corrective_actions_responsible_department_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('corrective_actions', 'corrective_actions_responsible_department_idx');
    await queryInterface.removeIndex('corrective_actions', 'corrective_actions_incident_category_idx');
    await queryInterface.removeIndex('corrective_actions', 'corrective_actions_source_item_unique');
    await queryInterface.removeIndex('corrective_actions', 'corrective_actions_capa_number_unique');

    const [users] = await queryInterface.sequelize.query('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
    const fallbackUserId = users[0]?.id;
    if (!fallbackUserId) throw new Error('Cannot roll back CAPA register fields without at least one user.');
    await queryInterface.sequelize.query(`
      UPDATE corrective_actions
      SET assigned_to = COALESCE(assigned_to, :fallbackUserId),
          assigned_by = COALESCE(assigned_by, :fallbackUserId),
          due_date = COALESCE(due_date, DATE(created_at)),
          priority = COALESCE(priority, 'medium')
    `, { replacements: { fallbackUserId } });
    await queryInterface.sequelize.query(`
      ALTER TABLE corrective_actions
        MODIFY assigned_to CHAR(36) BINARY NOT NULL COMMENT 'FK to users.id - who must complete this action',
        MODIFY assigned_by CHAR(36) BINARY NOT NULL COMMENT 'FK to users.id - who assigned this action',
        MODIFY due_date DATE NOT NULL,
        MODIFY priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium'
    `);

    await queryInterface.removeColumn('corrective_actions', 'last_synced_at');
    await queryInterface.removeColumn('corrective_actions', 'responsibility');
    await queryInterface.removeColumn('corrective_actions', 'responsible_department_id');
    await queryInterface.removeColumn('corrective_actions', 'incident_category');
    await queryInterface.removeColumn('corrective_actions', 'source_reference');
    await queryInterface.removeColumn('corrective_actions', 'source_item_key');
    await queryInterface.removeColumn('corrective_actions', 'source_item_id');
    await queryInterface.removeColumn('corrective_actions', 'capa_number');
  },
};

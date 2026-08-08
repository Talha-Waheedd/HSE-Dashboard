'use strict';

/**
 * Reconciles the original legacy reporting tables with the current Sequelize
 * models. Existing installations may already have the current columns, so
 * every operation is conditional and safe to run once through Sequelize.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const reconcile = async (tableName, columns, nullableLegacyColumns = []) => {
      const existing = await queryInterface.describeTable(tableName);
      for (const [name, definition] of Object.entries(columns)) {
        if (!existing[name]) await queryInterface.addColumn(tableName, name, definition);
      }
      for (const name of nullableLegacyColumns) {
        if (existing[name]) {
          await queryInterface.changeColumn(tableName, name, {
            type: Sequelize.DATEONLY,
            allowNull: true,
          });
        }
      }
    };

    await reconcile('hazards', {
      reported_by: { type: Sequelize.UUID, allowNull: true },
      plant_id: { type: Sequelize.UUID, allowNull: true },
      category: { type: Sequelize.STRING, allowNull: true },
      severity_level: { type: Sequelize.STRING, allowNull: true },
      title: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.STRING, allowNull: true },
      assigned_to: { type: Sequelize.UUID, allowNull: true },
      action_taken: { type: Sequelize.TEXT, allowNull: true },
      reported_at: { type: Sequelize.DATE, allowNull: true },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
      resolved_by: { type: Sequelize.UUID, allowNull: true },
      closed_at: { type: Sequelize.DATE, allowNull: true },
      closed_by: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
    }, ['date']);

    await reconcile('incidents', {
      incident_number: { type: Sequelize.STRING(30), allowNull: true, unique: true },
      reported_by: { type: Sequelize.UUID, allowNull: true },
      plant_id: { type: Sequelize.UUID, allowNull: true },
      incident_type: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: true },
      severity_level: { type: Sequelize.STRING, allowNull: true },
      title: { type: Sequelize.STRING(255), allowNull: true },
      incident_date: { type: Sequelize.DATEONLY, allowNull: true },
      incident_time: { type: Sequelize.TIME, allowNull: true },
      injured_person_id: { type: Sequelize.UUID, allowNull: true },
      injured_person_name: { type: Sequelize.STRING(150), allowNull: true },
      lost_days: { type: Sequelize.INTEGER, allowNull: true },
      restricted_days: { type: Sequelize.INTEGER, allowNull: true },
      first_aid_given: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      immediate_action: { type: Sequelize.TEXT, allowNull: true },
      investigated_by: { type: Sequelize.UUID, allowNull: true },
      investigation_findings: { type: Sequelize.TEXT, allowNull: true },
      closed_at: { type: Sequelize.DATE, allowNull: true },
      closed_by: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
    }, ['date']);
  },

  async down() {
    // The reconciliation is intentionally non-destructive. Legacy columns
    // and migrated columns are retained for rollback safety.
  },
};

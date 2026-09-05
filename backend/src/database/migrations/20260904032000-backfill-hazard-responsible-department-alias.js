'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE hazards h
       JOIN departments d
         ON d.deleted_at IS NULL
        AND (
          LOWER(TRIM(d.name)) = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible'))))
          OR LOWER(TRIM(COALESCE(d.code, ''))) = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(h.metadata, '$.responsible'))))
        )
       SET h.responsible_department_id = d.id
       WHERE h.responsible_department_id IS NULL`,
    );
  },

  async down() {
    // Data-only reconciliation is intentionally retained on rollback. Clearing
    // these links would make historical hazards lose their manager scope.
  },
};

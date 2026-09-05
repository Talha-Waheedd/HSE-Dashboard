'use strict';

require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sequelize, Sequelize } = require('../src/database/connection');
const { ROLES } = require('../src/shared/constants/roles');
const { PERMISSIONS } = require('../src/shared/constants/permissions');
const locationsSeeder = require('../src/database/seeders/06-locations.seeder');

const stableUuid = (key) => {
  const hex = crypto.createHash('sha256').update(`cbl-hse:${key}`).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`;
};

const roleDefinitions = [
  [ROLES.SYSTEM_ADMINISTRATOR, 'System Administrator', true],
  [ROLES.ADMINISTRATOR, 'Administrator', true],
  [ROLES.HSE_MANAGER, 'HSE Manager', true],
  [ROLES.HSE_OFFICER, 'HSE Officer', true],
  [ROLES.DEPARTMENT_MANAGER, 'Department Manager', false],
  [ROLES.DATA_ENTRY_OPERATOR, 'Data Entry Operator', false],
  [ROLES.VIEWER, 'Viewer', true],
];

const defaultDepartments = ['ADM', 'ESD', 'HSE', 'IT', 'Others', 'PRD', 'Projects', 'QC/FS/NPD', 'Stores'];
const viewKeys = Object.values(PERMISSIONS).filter(key => /:(view|read)$/.test(key) || key === PERMISSIONS.HSE_VIEW_DASHBOARD || key === PERMISSIONS.HSE_VIEW_REPORTS);
const createKeys = Object.values(PERMISSIONS).filter(key => /:create$/.test(key) || ['hse:report_hazard', 'hse:report_incident'].includes(key));
const hseOperationalKeys = Object.values(PERMISSIONS).filter(key => !/^(user|role|settings|notification):/.test(key));
const rolePermissions = {
  [ROLES.SYSTEM_ADMINISTRATOR]: Object.values(PERMISSIONS),
  [ROLES.ADMINISTRATOR]: Object.values(PERMISSIONS),
  [ROLES.HSE_MANAGER]: hseOperationalKeys,
  [ROLES.HSE_OFFICER]: hseOperationalKeys.filter(key => !/:delete$/.test(key) && key !== PERMISSIONS.HAZARD_REVIEW_CLOSURE),
  [ROLES.DEPARTMENT_MANAGER]: [...viewKeys, PERMISSIONS.HAZARD_SUBMIT_CLOSURE, PERMISSIONS.HAZARD_UPDATE, PERMISSIONS.CORRECTIVE_ACTION_UPDATE, PERMISSIONS.ATTACHMENT_CREATE],
  [ROLES.DATA_ENTRY_OPERATOR]: [...viewKeys, ...createKeys, PERMISSIONS.ATTACHMENT_CREATE],
  [ROLES.VIEWER]: viewKeys,
};

const upsertRolesAndPermissions = async (transaction) => {
  for (const [name, displayName, isSystem] of roleDefinitions) {
    await sequelize.query(
      `INSERT INTO roles (id, name, display_name, description, is_system, created_at, updated_at)
       VALUES (:id, :name, :displayName, :description, :isSystem, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), description = VALUES(description), is_system = VALUES(is_system), deleted_at = NULL, updated_at = CURRENT_TIMESTAMP`,
      { replacements: { id: stableUuid(`role:${name}`), name, displayName, description: `${displayName} application role`, isSystem }, transaction },
    );
  }

  for (const key of Object.values(PERMISSIONS)) {
    const [group, action] = key.split(':');
    const displayName = `${action.replaceAll('_', ' ')} ${group.replaceAll('_', ' ')}`.replace(/\b\w/g, letter => letter.toUpperCase());
    await sequelize.query(
      `INSERT INTO permissions (id, \`key\`, display_name, \`group\`, description, created_at, updated_at)
       VALUES (:id, :key, :displayName, :group, :description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), \`group\` = VALUES(\`group\`), description = VALUES(description), updated_at = CURRENT_TIMESTAMP`,
      { replacements: { id: stableUuid(`permission:${key}`), key, displayName, group, description: `Allows ${action.replaceAll('_', ' ')} on ${group.replaceAll('_', ' ')}` }, transaction },
    );
  }

  for (const [roleName, permissionKeys] of Object.entries(rolePermissions)) {
    await sequelize.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
       SELECT r.id, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM roles r JOIN permissions p ON p.\`key\` IN (:permissionKeys)
       WHERE r.name = :roleName`,
      { replacements: { roleName, permissionKeys: [...new Set(permissionKeys)] }, transaction },
    );
  }
};

const ensureMasterData = async (transaction) => {
  const [plantRows] = await sequelize.query('SELECT id FROM plants WHERE is_active = 1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1', { transaction });
  let plantId = plantRows[0]?.id;
  if (!plantId) {
    plantId = process.env.DEFAULT_PLANT_ID || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b';
    await sequelize.query(
      `INSERT INTO plants (id, name, code, location, country, is_active, created_at, updated_at)
       VALUES (:id, :name, :code, :location, 'Pakistan', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      {
        replacements: {
          id: plantId,
          name: process.env.DEFAULT_PLANT_NAME || 'CBL LU Sukkur Plant',
          code: process.env.DEFAULT_PLANT_CODE || 'CBL-LU-SUKKUR',
          location: process.env.DEFAULT_PLANT_LOCATION || 'Sukkur, Sindh',
        },
        transaction,
      },
    );
  }

  const [departmentCountRows] = await sequelize.query('SELECT COUNT(*) total FROM departments WHERE deleted_at IS NULL', { transaction });
  if (Number(departmentCountRows[0]?.total || 0) === 0) {
    for (const name of defaultDepartments) {
      await sequelize.query(
        `INSERT INTO departments (id, plant_id, name, code, is_active, created_at, updated_at)
         VALUES (:id, :plantId, :name, :code, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        { replacements: { id: stableUuid(`department:${name}`), plantId, name, code: name.length <= 20 ? name : null }, transaction },
      );
    }
  }
  return plantId;
};

const ensureOptionalAdmin = async (transaction) => {
  const email = String(process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) return false;
  const firstName = String(process.env.SEED_ADMIN_FIRST_NAME || 'Deployment').trim();
  const lastName = String(process.env.SEED_ADMIN_LAST_NAME || 'Administrator').trim();
  const password = String(process.env.SEED_ADMIN_PASSWORD || '');
  if (password && password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters.');
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;
  const [roleRows] = await sequelize.query('SELECT id FROM roles WHERE name = :name LIMIT 1', { replacements: { name: ROLES.SYSTEM_ADMINISTRATOR }, transaction });
  await sequelize.query(
    `INSERT INTO users (id, first_name, last_name, email, password, status, is_email_verified, role_id, created_at, updated_at)
     VALUES (:id, :firstName, :lastName, :email, :passwordHash, 1, 1, :roleId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), role_id = VALUES(role_id), status = 1, updated_at = CURRENT_TIMESTAMP`,
    { replacements: { id: crypto.randomUUID(), firstName, lastName, email, passwordHash, roleId: roleRows[0].id }, transaction },
  );
  return true;
};

const run = async () => {
  await sequelize.authenticate();
  const transaction = await sequelize.transaction();
  try {
    await upsertRolesAndPermissions(transaction);
    await ensureMasterData(transaction);
    const adminCreated = await ensureOptionalAdmin(transaction);
    await transaction.commit();
    await locationsSeeder.up(sequelize.getQueryInterface(), Sequelize);
    process.stdout.write(`Database seed complete (idempotent). Optional administrator ${adminCreated ? 'provisioned' : 'skipped; set SEED_ADMIN_EMAIL to provision one'}.\n`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

run()
  .catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());

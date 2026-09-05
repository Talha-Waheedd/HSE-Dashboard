'use strict';

require('dotenv').config();

const crypto = require('crypto');
const { sequelize } = require('../src/database/connection');
const {
  User, Role, Employee, Department,
} = require('../src/database/models');
const { hashPassword } = require('../src/shared/utils/hashHelper');

const dryRun = process.argv.includes('--dry-run');
const rotatePasswords = process.argv.includes('--rotate-passwords');

const USER_SPECS = [
  { localPart: 'test.adm.manager', firstName: 'Test ADM', department: 'ADM', role: 'Department Manager', employeeId: 'TEST-RBAC-ADM' },
  { localPart: 'test.esd.manager', firstName: 'Test ESD', department: 'ESD', role: 'Department Manager', employeeId: 'TEST-RBAC-ESD' },
  { localPart: 'test.prd.manager', firstName: 'Test PRD', department: 'PRD', role: 'Department Manager', employeeId: 'TEST-RBAC-PRD' },
  { localPart: 'test.stores.manager', firstName: 'Test Stores', department: 'Stores', role: 'Department Manager', employeeId: 'TEST-RBAC-STORES' },
  { localPart: 'test.hse.manager', firstName: 'Test HSE', department: 'HSE', role: 'HSE Manager', employeeId: 'TEST-RBAC-HSE' },
];

// Existing application users establish cbl.com as the development identity
// domain. The Entra provisioning script verifies this domain against the
// configured tenant before creating any cloud account.
const DEVELOPMENT_IDENTITY_DOMAIN = 'cbl.com';

const temporaryPassword = () => `${crypto.randomBytes(18).toString('base64url')}aA1!`;

const main = async () => {
  const roles = await Role.findAll({ where: { name: [...new Set(USER_SPECS.map(({ role }) => role))] } });
  const departments = await Department.findAll({
    where: { name: USER_SPECS.map(({ department }) => department), isActive: true },
  });
  const roleByName = new Map(roles.map((role) => [role.name, role]));
  const departmentByName = new Map(departments.map((department) => [department.name, department]));

  for (const spec of USER_SPECS) {
    if (!roleByName.has(spec.role)) throw new Error(`Role not found: ${spec.role}`);
    if (!departmentByName.has(spec.department)) throw new Error(`Active department not found: ${spec.department}`);
  }

  if (dryRun) {
    process.stdout.write(`${JSON.stringify({
      dryRun: true,
      users: USER_SPECS.map((spec) => ({
        email: `${spec.localPart}@${DEVELOPMENT_IDENTITY_DOMAIN}`,
        role: spec.role,
        department: spec.department,
      })),
    }, null, 2)}\n`);
    return;
  }

  const credentials = [];
  const transaction = await sequelize.transaction();
  try {
    for (const spec of USER_SPECS) {
      const email = `${spec.localPart}@${DEVELOPMENT_IDENTITY_DOMAIN}`;
      const role = roleByName.get(spec.role);
      const department = departmentByName.get(spec.department);
      let user = await User.unscoped().findOne({ where: { email }, transaction });
      const isNew = !user;
      const password = isNew || rotatePasswords ? temporaryPassword() : null;

      if (isNew) {
        user = await User.create({
          firstName: spec.firstName,
          lastName: 'Manager',
          email,
          password: await hashPassword(password),
          status: true,
          isEmailVerified: true,
          roleId: role.id,
        }, { transaction });
      } else {
        await user.update({
          firstName: spec.firstName,
          lastName: 'Manager',
          status: true,
          isEmailVerified: true,
          roleId: role.id,
          ...(password ? { password: await hashPassword(password) } : {}),
        }, { transaction });
      }

      const [employee] = await Employee.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          employeeId: spec.employeeId,
          departmentId: department.id,
          plantId: department.plantId,
          designation: spec.role,
        },
        transaction,
      });
      await employee.update({
        departmentId: department.id,
        plantId: department.plantId,
        designation: spec.role,
      }, { transaction });

      await department.update({ managerId: user.id }, { transaction });
      credentials.push({
        email,
        temporaryPassword: password || 'UNCHANGED_EXISTING_PASSWORD',
        role: spec.role,
        department: spec.department,
        created: isNew,
        passwordRotated: Boolean(password && !isNew),
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  process.stdout.write(`${JSON.stringify({
    createdOrUpdated: credentials.length,
    passwordsAreTemporary: true,
    credentials,
  }, null, 2)}\n`);
};

main()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/database/connection');
const { Plant, User } = require('../src/database/models');
const criticalAuditPlanService = require('../src/modules/audits/critical-audit-plan.service');

const run = async () => {
  const fileArgument = process.argv[2];
  if (!fileArgument) throw new Error('Usage: npm run import:critical-audit-plan -- <workbook.xlsx> [plantId] [userId]');
  const filePath = path.resolve(fileArgument);
  const plant = process.argv[3]
    ? await Plant.findByPk(process.argv[3])
    : await Plant.findOne({ where: { isActive: true }, order: [['createdAt', 'ASC']] });
  const user = process.argv[4]
    ? await User.findByPk(process.argv[4])
    : await User.findOne({ where: { status: true }, order: [['createdAt', 'ASC']] });
  if (!plant) throw new Error('No active plant was found. Pass a plant UUID as the second argument.');
  if (!user) throw new Error('No active user was found. Pass a user UUID as the third argument.');
  const result = await criticalAuditPlanService.importWorkbook({
    buffer: await fs.promises.readFile(filePath),
    filename: path.basename(filePath),
    plantId: plant.id,
    userId: user.id,
  });
  process.stdout.write(`${JSON.stringify({ plant: { id: plant.id, name: plant.name }, user: { id: user.id, email: user.email }, ...result }, null, 2)}\n`);
};

run()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());

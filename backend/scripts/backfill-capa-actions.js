'use strict';

require('dotenv').config();
const { sequelize } = require('../src/database/connection');
const { backfillAll } = require('../src/modules/actions/capa-sync.service');

const dryRun = !process.argv.includes('--apply');

const main = async () => {
  const result = await backfillAll({ dryRun });
  console.log(JSON.stringify(result, null, 2));
  if (dryRun) console.log('Dry run only. Re-run with --apply to synchronize CAPA Actions.');
};

main()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(error.stack || error.message);
    await sequelize.close();
    process.exitCode = 1;
  });

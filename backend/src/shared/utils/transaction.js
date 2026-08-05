'use strict';

const { sequelize } = require('../../database/connection');

/**
 * Execute a unit of work in a Sequelize transaction. Existing transactions
 * can be passed through by callers composing multiple services.
 */
const withTransaction = async (work, existingTransaction = null) => {
  if (existingTransaction) return work(existingTransaction);

  return sequelize.transaction(async (transaction) => work(transaction));
};

module.exports = { withTransaction };


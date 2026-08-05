'use strict';

require('dotenv').config({ path: '.env.test' });

// Silence logger in tests
jest.mock('./src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

afterAll(async () => {
  // Close DB connection after all tests
  try {
    const { sequelize } = require('./src/database/connection');
    await sequelize.close();
  } catch {
    // ignore
  }
});

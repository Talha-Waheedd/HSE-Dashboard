module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/database/migrations/**', '!src/database/seeders/**'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterFramework: ['./tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
};

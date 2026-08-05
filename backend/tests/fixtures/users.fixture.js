'use strict';

const { faker } = require('@faker-js/faker');

const createUserFixture = (overrides = {}) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  password: 'Test@123!',
  ...overrides,
});

module.exports = { createUserFixture };

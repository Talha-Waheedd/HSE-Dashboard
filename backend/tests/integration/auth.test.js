'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/database/connection');

describe('Auth API — Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Fresh DB for each test run
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 and user data on valid registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
          password: 'Test@123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should return 422 on missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 409 if email is already taken', async () => {
      await request(app).post('/api/v1/auth/register').send({
        firstName: 'Jane', lastName: 'Doe', email: 'dupe@test.com', password: 'Test@123!',
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        firstName: 'Jane', lastName: 'Doe', email: 'dupe@test.com', password: 'Test@123!',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('uptime');
    });
  });
});

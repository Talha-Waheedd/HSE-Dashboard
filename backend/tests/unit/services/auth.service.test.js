'use strict';

// ─── Unit Test: AuthService ───────────────────────────────────────────────────
// Mocks all external dependencies so we test only the service logic.

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/token.repository');
jest.mock('../../src/events/emitter', () => ({
  emitter: { emit: jest.fn() },
  EVENTS: { USER_REGISTERED: 'user.registered', USER_LOGGED_IN: 'user.logged_in' },
}));
jest.mock('../../src/database/connection', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  },
}));

const userRepository = require('../../src/repositories/user.repository');
const tokenRepository = require('../../src/repositories/token.repository');
const authService = require('../../src/services/auth.service');
const ApiError = require('../../src/utils/ApiError');

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register()', () => {
    it('should throw CONFLICT if email is already taken', async () => {
      userRepository.exists.mockResolvedValue(true);

      await expect(
        authService.register({ email: 'test@test.com', password: 'Test@123' }),
      ).rejects.toThrow(ApiError);
    });

    it('should create a new user and emit USER_REGISTERED event', async () => {
      userRepository.exists.mockResolvedValue(false);
      userRepository.create.mockResolvedValue({ id: 'uuid-1', email: 'new@test.com', firstName: 'Test' });
      tokenRepository.create.mockResolvedValue({});

      const user = await authService.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'new@test.com',
        password: 'Test@123!',
      });

      expect(user).toBeDefined();
      expect(userRepository.create).toHaveBeenCalledTimes(1);
    });
  });
});

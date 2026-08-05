'use strict';

const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { Token } = require('../database/models');
const TokenType = require('../shared/enums/TokenType');

class TokenRepository extends BaseRepository {
  constructor() {
    super(Token);
  }

  async findValidToken(token, type) {
    return Token.findOne({
      where: {
        token,
        type,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
  }

  async revokeAllUserTokens(userId, type, transaction = null) {
    return Token.update(
      { isRevoked: true },
      { where: { userId, type, isRevoked: false }, transaction },
    );
  }

  async deleteExpiredTokens() {
    return Token.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } },
      force: true,
    });
  }

  async createRefreshToken(data, transaction = null) {
    return Token.create({ ...data, type: TokenType.REFRESH }, { transaction });
  }
}

module.exports = new TokenRepository();

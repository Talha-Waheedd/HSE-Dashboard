'use strict';

const BaseRepository = require('./base.repository');
const { buildEnterpriseQuery } = require('../shared/utils/enterpriseQuery');

/**
 * Repository base for schema-first enterprise modules. It contains data
 * access primitives only; workflow decisions belong in services.
 */
class EnterpriseBaseRepository extends BaseRepository {
  constructor(model, queryOptions = {}) {
    super(model);
    this.queryOptions = queryOptions;
  }

  async list(query = {}, options = {}) {
    const parsed = buildEnterpriseQuery(query, { ...this.queryOptions, ...options.queryOptions });
    const result = await this.model.findAndCountAll({
      ...options,
      where: { ...(parsed.where || {}), ...(options.where || {}) },
      order: options.order || parsed.order,
      limit: options.limit || parsed.limit,
      offset: options.offset || parsed.offset,
      distinct: true,
    });

    return {
      rows: result.rows,
      count: result.count,
      meta: {
        ...parsed.meta,
        total: result.count,
        totalPages: Math.ceil(result.count / parsed.limit),
        hasNextPage: parsed.page < Math.ceil(result.count / parsed.limit),
        hasPrevPage: parsed.page > 1,
      },
    };
  }

  async restoreById(id, options = {}) {
    return this.model.restore({ where: { [this.model.primaryKeyAttribute]: id }, ...options });
  }

  async bulkUpdate(data, where, options = {}) {
    return this.model.update(data, { where, ...options });
  }

  async statistics(where = {}, options = {}) {
    return this.model.findAll({
      where,
      attributes: options.attributes || undefined,
      group: options.group || undefined,
      raw: true,
      transaction: options.transaction,
    });
  }
}

module.exports = EnterpriseBaseRepository;


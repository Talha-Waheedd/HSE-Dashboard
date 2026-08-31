'use strict';

const HseActionItem = require('./hse-action-item.model');

class HseActionItemService {
  async findAll(query = {}) {
    const { page = 1, limit = 25, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
    const offset = (Math.max(1, page) - 1) * Math.max(1, limit);
    const order = [[sort_by, sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']];

    const where = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.plantId) {
      where.plantId = filters.plantId;
    }
    
    // Add any other simple filters here as needed.

    const { count, rows } = await HseActionItem.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order,
    });

    return {
      data: rows,
      meta: {
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  }

  async findById(id) {
    return HseActionItem.findByPk(id);
  }

  async create(data) {
    return HseActionItem.create(data);
  }

  async update(id, data) {
    const item = await this.findById(id);
    if (!item) return null;
    return item.update(data);
  }

  async delete(id) {
    const item = await this.findById(id);
    if (!item) return null;
    await item.destroy();
    return true;
  }
}

module.exports = new HseActionItemService();

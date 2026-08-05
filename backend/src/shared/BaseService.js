/**
 * Abstract Base Service
 * Wraps repository data access with standard business logic and transaction safety.
 */
class BaseService {
    constructor(repository) {
        if (!repository) throw new Error('Repository is required in BaseService');
        this.repository = repository;
    }

    async create(data, options = {}) {
        return this.repository.create(data, options);
    }

    async getById(id, options = {}) {
        return this.repository.findById(id, options);
    }

    async getAll(options = {}) {
        return this.repository.findAll(options);
    }

    async getPaginated(options = {}, page = 1, limit = 10) {
        return this.repository.findAllWithPagination(options, page, limit);
    }

    async update(id, data, options = {}) {
        return this.repository.update(id, data, options);
    }

    async delete(id, options = {}) {
        return this.repository.delete(id, options);
    }

    async restore(id, options = {}) {
        return this.repository.restore(id, options);
    }
}

module.exports = BaseService;

/**
 * Abstract Base Repository
 * Centralizes Data Access Layer (DAL) logic to prevent duplication across modules.
 * Every module-specific repository extends this class.
 */
class BaseRepository {
    constructor(model) {
        if (!model) throw new Error('Model is required in BaseRepository');
        this.model = model;
    }

    async create(data, options = {}) {
        return this.model.create(data, options);
    }

    async findById(id, options = {}) {
        return this.model.findByPk(id, options);
    }

    async findOne(options = {}) {
        return this.model.findOne(options);
    }

    async findAll(options = {}) {
        return this.model.findAll(options);
    }

    /**
     * Standardized pagination utilizing Sequelize findAndCountAll
     */
    async findAllWithPagination(options = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await this.model.findAndCountAll({
            ...options,
            limit,
            offset,
            distinct: true
        });
        
        return {
            data: result.rows,
            meta: {
                total: result.count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(result.count / limit)
            }
        };
    }

    async update(id, data, options = {}) {
        const record = await this.findById(id, options);
        if (!record) return null;
        return record.update(data, options);
    }

    async delete(id, options = {}) {
        const record = await this.findById(id, options);
        if (!record) return false;
        await record.destroy(options); // Soft delete triggered by paranoid: true
        return true;
    }

    async forceDelete(id, options = {}) {
        const record = await this.findById(id, { ...options, paranoid: false });
        if (!record) return false;
        await record.destroy({ ...options, force: true });
        return true;
    }

    async restore(id, options = {}) {
        return this.model.restore({ where: { id }, ...options });
    }
    
    async bulkCreate(dataArray, options = {}) {
        return this.model.bulkCreate(dataArray, options);
    }
}

module.exports = BaseRepository;

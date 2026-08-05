const { Model } = require('sequelize');

/**
 * Enterprise Base Model
 * Abstract model extending Sequelize Model to automatically enforce
 * soft deletes, enterprise audit fields (created_by, updated_by),
 * and strict primary key types across all 160+ tables.
 */
class BaseModel extends Model {
    static init(attributes, options) {
        const DataTypes = options.sequelize.Sequelize.DataTypes;
        
        // Enforce enterprise audit fields on all inherited models
        const enterpriseAttributes = {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            deleted_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            // Merge in the module-specific attributes
            ...attributes
        };

        const enterpriseOptions = {
            ...options,
            timestamps: true,
            paranoid: true, // Enforces soft-deletes (deleted_at) globally
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
            
            // Standardizing table names mapping
            underscored: true,
        };

        return super.init(enterpriseAttributes, enterpriseOptions);
    }
}

module.exports = BaseModel;

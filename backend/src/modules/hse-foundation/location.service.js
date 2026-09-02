'use strict';

const locationRepository = require('../../repositories/location.repository');
const { sequelize } = require('../../database/connection');
const { ApiError } = require('../../shared/utils/index');

const normalize = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase();
class LocationService {
  async create(data, userId) {
    const normalizedName = normalize(data.name);
    if (await locationRepository.findOne({ normalizedName })) throw ApiError.conflict('Location already exists');
    if (data.code && await locationRepository.findOne({ code: data.code.trim() })) throw ApiError.conflict('Location code already exists');
    return locationRepository.create({
      ...data,
      name: data.name.trim(),
      code: data.code?.trim() || null,
      normalizedName,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async list(options = {}) { return locationRepository.findAndCountAll(options); }

  async get(id) { const item = await locationRepository.findById(id); if (!item) throw ApiError.notFound('Location not found'); return item; }

  async update(id, data, userId) {
    const item = await this.get(id); const patch = { ...data, updatedBy: userId };
    if (data.name) { patch.name = data.name.trim(); patch.normalizedName = normalize(data.name); const duplicate = await locationRepository.findOne({ normalizedName: patch.normalizedName }); if (duplicate && duplicate.id !== item.id) throw ApiError.conflict('Location already exists'); }
    if (Object.prototype.hasOwnProperty.call(data, 'code')) { patch.code = data.code?.trim() || null; if (patch.code) { const duplicate = await locationRepository.findOne({ code: patch.code }); if (duplicate && duplicate.id !== item.id) throw ApiError.conflict('Location code already exists'); } }
    const transaction = await sequelize.transaction();
    try {
      await locationRepository.updateById(id, patch, { transaction });
      // Reporting tables predate the location master and store the selected
      // location as text. Keep those clear, semantically equivalent columns in
      // sync on rename until they can be migrated to location_id foreign keys.
      if (patch.name && patch.name !== item.name) {
        await Promise.all(['hazards', 'near_misses', 'incidents'].map((table) => (
          sequelize.query(
            `UPDATE \`${table}\` SET location = :newName WHERE location = :oldName`,
            { replacements: { newName: patch.name, oldName: item.name }, transaction },
          )
        )));
        await sequelize.query(
          'UPDATE `inspections` SET area = :newName WHERE area = :oldName',
          { replacements: { newName: patch.name, oldName: item.name }, transaction },
        );
      }
      await transaction.commit();
      return this.get(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id, userId) {
    await this.get(id);
    await locationRepository.updateById(id, { isActive: false, updatedBy: userId });
    return this.get(id);
  }
}
module.exports = new LocationService();

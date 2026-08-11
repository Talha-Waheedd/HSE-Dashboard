'use strict';
const locationRepository = require('../../repositories/location.repository');
const { ApiError } = require('../../shared/utils/index');
const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
class LocationService {
  async create(data, userId) {
    const normalizedName = normalize(data.name);
    if (await locationRepository.findOne({ normalizedName })) throw ApiError.conflict('Location already exists');
    return locationRepository.create({ ...data, normalizedName, createdBy: userId, updatedBy: userId });
  }
  async list(options = {}) { return locationRepository.findAndCountAll(options); }
  async get(id) { const item = await locationRepository.findById(id); if (!item) throw ApiError.notFound('Location not found'); return item; }
  async update(id, data, userId) {
    const item = await this.get(id); const patch = { ...data, updatedBy: userId };
    if (data.name) { patch.normalizedName = normalize(data.name); const duplicate = await locationRepository.findOne({ normalizedName: patch.normalizedName }); if (duplicate && duplicate.id !== item.id) throw ApiError.conflict('Location already exists'); }
    return locationRepository.updateById(id, patch);
  }
  async remove(id) { await this.get(id); return locationRepository.deleteById(id); }
}
module.exports = new LocationService();

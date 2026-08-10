'use strict';

const incidentRepository = require('../../repositories/incident.repository');
const plantRepository = require('../../repositories/plant.repository');
const IncidentStatus = require('../../shared/enums/IncidentStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');

const normalizeActions = (actions) => (Array.isArray(actions) ? actions.map((item) => ({
  ...item,
  action: String(item?.action ?? item?.action_description ?? '').trim(),
  responsible_person: String(item?.responsible_person ?? item?.responsiblePerson ?? item?.responsibility ?? item?.responsible ?? '').trim(),
  responsible_department: String(item?.responsible_department ?? item?.responsibleDepartment ?? '').trim(),
  timeline: item?.timeline ?? item?.deadline ?? item?.timeline_deadline ?? null,
  severity: ['Low', 'Medium', 'High'].includes(item?.severity) ? item.severity : 'Medium',
  status: ['Open', 'Planned', 'Closed'].includes(item?.status) ? item.status : 'Open',
})) : []);

const validateActionLimit = (actions) => {
  if (Array.isArray(actions) && actions.length > 15) {
    throw ApiError.badRequest('An incident can contain a maximum of 15 actions.');
  }
};

class IncidentService {
  /**
   * Report a new incident
   * Uses a transaction to create the incident and any associated injuries
   */
  async createIncident(data, userId) {
    validateActionLimit(data.actions);
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    const { actions, metadata, ...incidentData } = data;
    const persistedData = {
      ...incidentData,
      metadata: {
        ...(metadata || {}),
        ...(actions !== undefined ? { actions: normalizeActions(actions) } : {}),
      },
      reportedBy: userId,
      createdBy: userId,
    };
    
    if (![IncidentStatus.DRAFT, IncidentStatus.REPORTED].includes(persistedData.status)) {
      persistedData.status = IncidentStatus.DRAFT;
    }

    // Generate incident number (e.g. INC-2026-0001)
    const currentYear = new Date().getFullYear();
    const count = await incidentRepository.model.count({
      where: {
        incidentDate: {
          [sequelize.Sequelize.Op.gte]: `${currentYear}-01-01`,
        },
      },
      paranoid: false, // Include deleted in the count to avoid duplicate numbers
    });
    
    persistedData.incidentNumber = `INC-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const transaction = await sequelize.transaction();
    try {
      // 1. Create incident
      const incident = await incidentRepository.create(persistedData, { transaction });

      // 2. Create injuries if provided
      if (persistedData.injuries && Array.isArray(persistedData.injuries) && persistedData.injuries.length > 0) {
        const injuriesData = persistedData.injuries.map(injury => ({
          ...injury,
          incidentId: incident.id,
        }));
        await incidentRepository.model.sequelize.models.IncidentInjury.bulkCreate(injuriesData, { transaction });
      }

      await transaction.commit();
      return this.getIncidentById(incident.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all incidents
   */
  async getAllIncidents(options = {}) {
    return incidentRepository.findAll(options);
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(id) {
    const incident = await incidentRepository.getDetails(id);
    if (!incident) {
      throw ApiError.notFound(MESSAGES.INCIDENT_NOT_FOUND);
    }
    return incident;
  }

  /**
   * Update incident (excludes injuries array which requires separate handling)
   */
  async updateIncident(id, updateData, userId) {
    validateActionLimit(updateData.actions);
    const incident = await this.getIncidentById(id);

    if (updateData.plantId && updateData.plantId !== incident.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    const { actions, metadata, ...incidentFields } = updateData;
    const nextMetadata = {
      ...(incident.metadata || {}),
      ...(metadata || {}),
      ...(actions !== undefined ? { actions: normalizeActions(actions) } : {}),
    };
    return incidentRepository.updateById(id, {
      ...incidentFields,
      metadata: nextMetadata,
      updatedBy: userId,
    });
  }

  /**
   * Update incident status
   */
  async updateStatus(id, newStatus, userId) {
    const incident = await this.getIncidentById(id);

    const validStatuses = Object.values(IncidentStatus);
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest('Invalid incident status');
    }

    const updateData = {
      status: newStatus,
      updatedBy: userId,
    };

    if (newStatus === IncidentStatus.CLOSED) {
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    }

    return incidentRepository.updateById(id, updateData);
  }

  /**
   * Delete incident
   */
  async deleteIncident(id) {
    await this.getIncidentById(id);
    return incidentRepository.deleteById(id);
  }
}

module.exports = new IncidentService();

'use strict';

const CorrectiveActionSource = Object.freeze({
  HAZARD: 'hazard',
  NEAR_MISS: 'near_miss',
  INCIDENT: 'incident',
  AUDIT: 'audit',
  INSPECTION: 'inspection',
});

module.exports = CorrectiveActionSource;

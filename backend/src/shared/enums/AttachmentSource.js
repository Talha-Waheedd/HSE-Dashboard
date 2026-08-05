'use strict';

const AttachmentSource = Object.freeze({
  HAZARD: 'hazard',
  NEAR_MISS: 'near_miss',
  INCIDENT: 'incident',
  TRAINING: 'training',
  AUDIT: 'audit',
  INSPECTION: 'inspection',
  CORRECTIVE_ACTION: 'corrective_action',
});

module.exports = AttachmentSource;

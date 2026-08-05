'use strict';

const IncidentStatus = Object.freeze({
  DRAFT: 'draft',
  REPORTED: 'reported',
  UNDER_INVESTIGATION: 'under_investigation',
  CORRECTIVE_ACTION: 'corrective_action',
  CLOSED: 'closed',
});

module.exports = IncidentStatus;

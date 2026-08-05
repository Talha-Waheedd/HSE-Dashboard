'use strict';

const InspectionStatus = Object.freeze({
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
});

module.exports = InspectionStatus;

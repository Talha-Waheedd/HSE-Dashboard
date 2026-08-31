'use strict';

const TrainingStatus = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

module.exports = TrainingStatus;

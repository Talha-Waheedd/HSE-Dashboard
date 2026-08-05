'use strict';

const CorrectiveActionStatus = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
});

module.exports = CorrectiveActionStatus;

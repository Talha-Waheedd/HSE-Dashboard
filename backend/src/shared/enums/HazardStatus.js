'use strict';

const HazardStatus = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});

module.exports = HazardStatus;

'use strict';

const IncidentType = Object.freeze({
  FIRST_AID: 'first_aid',
  MTC: 'mtc',               // Medical Treatment Case
  LTI: 'lti',               // Lost Time Injury
  RWC: 'rwc',               // Restricted Work Case
  FATALITY: 'fatality',
  FIRE: 'fire',
  PROPERTY_DAMAGE: 'property_damage',
  ENVIRONMENTAL: 'environmental',
  NEAR_MISS_PROMOTED: 'near_miss_promoted',
});

module.exports = IncidentType;

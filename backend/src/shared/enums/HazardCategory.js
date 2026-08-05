'use strict';

const HazardCategory = Object.freeze({
  PHYSICAL: 'physical',
  CHEMICAL: 'chemical',
  BIOLOGICAL: 'biological',
  ERGONOMIC: 'ergonomic',
  ELECTRICAL: 'electrical',
  FIRE: 'fire',
  ENVIRONMENTAL: 'environmental',
  BEHAVIORAL: 'behavioral',
  OTHER: 'other',
});

module.exports = HazardCategory;

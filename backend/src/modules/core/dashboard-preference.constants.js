'use strict';

const INDICATOR_IDS = Object.freeze({
  leading: Object.freeze([
    'hazard-spotting',
    'near-miss',
    'unsafe-acts',
    'hazard-closure',
    'training-manhours',
    'inspections',
    'incident-capa-closure',
    'drills',
    'capa-closure',
    'legal',
  ]),
  lagging: Object.freeze([
    'fatalities',
    'lti',
    'ltir',
    'rwc-mtc',
    'trir',
    'first-aid',
    'fire',
  ]),
});

const DEFAULT_INDICATOR_PREFERENCES = Object.freeze({
  leadingIndicatorIds: Object.freeze(['hazard-spotting', 'training-manhours', 'capa-closure']),
  laggingIndicatorIds: Object.freeze(['first-aid', 'lti', 'fatalities']),
});

module.exports = { INDICATOR_IDS, DEFAULT_INDICATOR_PREFERENCES };

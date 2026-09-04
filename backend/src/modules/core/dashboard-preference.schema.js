'use strict';

const Joi = require('joi');
const { INDICATOR_IDS } = require('./dashboard-preference.constants');

const indicatorSelection = allowed => Joi.array()
  .items(Joi.string().valid(...allowed))
  .min(1)
  .max(3)
  .unique()
  .required();

const updateDashboardPreferenceSchema = Joi.object({
  leadingIndicatorIds: indicatorSelection(INDICATOR_IDS.leading),
  laggingIndicatorIds: indicatorSelection(INDICATOR_IDS.lagging),
});

module.exports = { updateDashboardPreferenceSchema };

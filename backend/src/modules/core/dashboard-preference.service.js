'use strict';

const DashboardIndicatorPreference = require('./dashboard-preference.model');
const { DEFAULT_INDICATOR_PREFERENCES } = require('./dashboard-preference.constants');

const serializedDefaults = () => ({
  leadingIndicatorIds: [...DEFAULT_INDICATOR_PREFERENCES.leadingIndicatorIds],
  laggingIndicatorIds: [...DEFAULT_INDICATOR_PREFERENCES.laggingIndicatorIds],
  customized: false,
});

const serialize = preference => ({
  leadingIndicatorIds: [...preference.leadingIndicatorIds],
  laggingIndicatorIds: [...preference.laggingIndicatorIds],
  customized: true,
});

class DashboardPreferenceService {
  async getForUser(userId) {
    const preference = await DashboardIndicatorPreference.findOne({ where: { userId } });
    return preference ? serialize(preference) : serializedDefaults();
  }

  async updateForUser(userId, values) {
    const [preference, created] = await DashboardIndicatorPreference.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        leadingIndicatorIds: values.leadingIndicatorIds,
        laggingIndicatorIds: values.laggingIndicatorIds,
      },
    });

    if (!created) {
      await preference.update({
        leadingIndicatorIds: values.leadingIndicatorIds,
        laggingIndicatorIds: values.laggingIndicatorIds,
      });
    }

    return serialize(preference);
  }
}

module.exports = new DashboardPreferenceService();

'use strict';

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

const dateHelper = {
  now: () => dayjs().toDate(),
  format: (date, fmt = 'YYYY-MM-DD HH:mm:ss') => dayjs(date).format(fmt),
  fromNow: (date) => dayjs(date).fromNow(),
  addMinutes: (date, minutes) => dayjs(date).add(minutes, 'minute').toDate(),
  addHours: (date, hours) => dayjs(date).add(hours, 'hour').toDate(),
  addDays: (date, days) => dayjs(date).add(days, 'day').toDate(),
  isExpired: (date) => dayjs().isAfter(dayjs(date)),
  toUTC: (date) => dayjs(date).utc().toDate(),
};

module.exports = dateHelper;

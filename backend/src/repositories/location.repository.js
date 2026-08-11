'use strict';
const BaseRepository = require('./base.repository');
const { Location } = require('../database/models');
class LocationRepository extends BaseRepository { constructor() { super(Location); } }
module.exports = new LocationRepository();

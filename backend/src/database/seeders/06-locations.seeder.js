'use strict';
const { v4: uuidv4 } = require('uuid');

const locations = [
  'Oil Tank Room 1 (B-62 Building)', 'Oil Tank Room 2 (B-62 Building)', 'Oil Tank Room 3 (B-62 Building)',
  'Oil Tank Room 4 (B-86 L-11))', 'Ammonia Shortnening Plant', 'HT/LT Room', 'UPS Rooms', 'Compressor Rooms',
  'Sub-Station (Cake Plant)', 'Chiller Room  Ground Floor', 'Chiller Room  First Floor', 'Cooling Tower',
  'Diesel Storage Area', 'PMS Warehouse', 'FGS Warehouse', 'Brown Sugar Storage Area', 'Boys Canteen Roof',
  'RMS Roof', 'Admin Block Roof', 'Oven Roof', 'Ovens  Non-Operational Areas', 'Gate-2 Gallery', 'Cold Storage Areas',
  'LPG Storage Area', 'Line-1 Packing', 'Line-2 Packing', 'Line-3 Packing', 'Line-4 Packing', 'Line-5 Packing',
  'Line-6 Packing', 'Line-7 Packing', 'Line-8 Packing', 'Line-9 Packing', 'Line-10 Packing', 'Line-11 Packing',
  'Cake Plant Packing', 'Line-1 Mixing', 'Line-2 Mixing', 'Line-3 Mixing', 'Line-4 Mixing', 'Line-5 Mixing',
  'Line-6 Mixing', 'Line-7 Mixing', 'Line-8 Mixing', 'Line-9 Mixing', 'Line-10 Mixing', 'Line-11 Mixing',
  'Cake Plant Mixing', 'Cake Plant Chocolate Area', 'Line-1 Cutting', 'Line-2 Cuitting', 'Line-3 Cutting',
  'Line-4 Cutting', 'Line-5 Cutting', 'Line-6 Cutting', 'Line-7 Cutting', 'Line-8 Cutting', 'Line-9 Cutting',
  'Line-10 Cutting', 'Line-11 Cutting', 'Line-1 Oven', 'Line-2 Oven', 'Line-3 Oven', 'Line-4 Oven', 'Line-5 Oven',
  'Line-6 Oven', 'Line-7 Oven', 'Line-8 Oven', 'Line-9 Oven', 'Line-10 Oven', 'Line-11 Oven', 'RMS Ground Floor',
  'RMS First Floor', 'Admin Roof', 'Admin Block', 'Boys Canteen', 'Girls Canteen', 'Power House', 'Jaali Gate',
  'Outside Jaali Gate', 'ESD Store', 'B-100 Warehouse', 'Gate-1', 'Gate-2', 'Gate-3', 'Gate-4', 'Gate-5', 'Silo Area',
  'Oil Silos', 'ESD Inner Workshop', 'ESD Outer Workshop', 'Near DPM Office', 'Line-8A Creaming', 'Line-8A Cooling Tunnel',
  'Line-8C Creaming', 'Line-8C Cooling Tunnel', 'Line-10A Creaming', 'Line-10A Cooling Tunnel', 'Line-10B Creaming',
  'Line-10B Cooling Tunnel', 'Line-8 Multiplexer', 'Line-10 Multiplexer', 'Chocolate Plant', 'Chemical Room Ground Floor',
  'Chemical Room First Floor', 'Chemical Room L-11', 'RMS Line-11', 'Pessenger Lift Admin Block', 'Pessenger Lift Prince Club House',
  'Pessenger Lift 3 Bed Appartment', 'Export Room', 'QR Printer Workshop', 'Date/Time Printer Workshop'
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Note: To support idempotency, we use INSERT IGNORE.
    // However, Sequelize doesn't have a direct `bulkInsert` ignore, so we loop with `upsert` or just try-catch each.
    const records = locations.map(name => ({
      id: uuidv4(),
      name: name.replace(/\)/g, '').trim(), // Clean up odd characters from copy-paste
      normalized_name: name.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // deduplicate normalized_names because unique constraint exists
    const uniqueRecords = [];
    const seen = new Set();
    for (const record of records) {
      if (!seen.has(record.normalized_name)) {
        seen.add(record.normalized_name);
        uniqueRecords.push(record);
      }
    }

    try {
      await queryInterface.bulkInsert('locations', uniqueRecords, { ignoreDuplicates: true });
    } catch (error) {
      console.warn('Seeder collision or error, attempting single inserts:', error.message);
      for (const record of uniqueRecords) {
        try {
          await queryInterface.insert(null, 'locations', record, { ignoreDuplicates: true });
        } catch (e) {
          // ignore duplicate entry error
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const normalizedNames = locations.map(name => name.toLowerCase().replace(/[^a-z0-9]/g, '').trim());
    await queryInterface.bulkDelete('locations', {
      normalized_name: { [Sequelize.Op.in]: normalizedNames }
    });
  }
};

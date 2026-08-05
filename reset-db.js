const { sequelize } = require('./src/database/connection');

async function resetDatabase() {
  try {
    console.log("Dropping all tables to reset the schema...");
    // Disable FK checks so we can drop tables in any order
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Get all tables in the database
    const [tables] = await sequelize.query('SHOW TABLES');
    
    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`Dropping table: ${tableName}`);
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    
    // Re-enable FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log("All tables dropped successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();

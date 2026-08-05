const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabases() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    console.log('Connected to MySQL server.');
    
    // Drop old databases
    console.log('Dropping old databases (cbl_db, cbl_hse, hse)...');
    await connection.query(`DROP DATABASE IF EXISTS \`cbl_db\`;`);
    await connection.query(`DROP DATABASE IF EXISTS \`cbl_hse\`;`);
    await connection.query(`DROP DATABASE IF EXISTS \`hse\`;`);
    
    // Create new database
    console.log(`Creating database '${process.env.DB_NAME}'...`);
    await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\`;`);
    
    await connection.end();
    console.log('Database reset complete.');
  } catch (error) {
    console.error('Error resetting databases:', error);
    process.exit(1);
  }
}

resetDatabases();

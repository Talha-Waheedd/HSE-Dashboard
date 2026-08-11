'use strict';
const dotenv = require('dotenv'); const mysql = require('mysql2/promise'); const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const aliases = { Store: 'Stores', QC: 'QC/FS/NPD', PRJ: 'Project', 'QC/NPD/FS': 'QC/FS/NPD' };
async function main() {
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await db.beginTransaction();
  try {
    for (const [from, to] of Object.entries(aliases)) {
      const [[source]] = await db.query('SELECT id FROM departments WHERE name = ? AND deleted_at IS NULL LIMIT 1', [from]);
      if (!source) continue;
      let [[target]] = await db.query('SELECT id FROM departments WHERE name = ? AND deleted_at IS NULL LIMIT 1', [to]);
      if (!target && from === 'QC/NPD/FS') { await db.query('UPDATE departments SET name = ?, updated_at = NOW() WHERE id = ?', [to, source.id]); continue; }
      if (!target) continue;
      await db.query('UPDATE training_sessions SET department_id = ?, updated_at = NOW() WHERE department_id = ?', [target.id, source.id]);
      await db.query('UPDATE departments SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [source.id]);
    }
    await db.commit();
  } catch (error) { await db.rollback(); throw error; } finally { await db.end(); }
}
main().catch(error => { console.error(error); process.exit(1); });

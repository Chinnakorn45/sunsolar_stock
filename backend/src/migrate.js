/**
 * migrate.js — รัน SQL migration files
 * สร้างตาราง products และ stock_transactions ใน PostgreSQL
 */
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, 'migrations', '001_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Running migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

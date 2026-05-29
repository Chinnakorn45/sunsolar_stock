/**
 * migrate.js — รัน SQL migration files ทั้งหมด
 * อ่านไฟล์จากโฟลเดอร์ migrations/ แล้วรันตามลำดับชื่อไฟล์
 */
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // เรียงตามชื่อ (001, 002, 003...)

    console.log(`🔄 Found ${files.length} migration files`);

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`   ▶ Running ${file}...`);
      await pool.query(sql);
      console.log(`   ✅ ${file} completed`);
    }

    console.log('✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

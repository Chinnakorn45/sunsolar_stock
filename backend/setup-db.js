/**
 * setup-db.js — สร้าง database solar_stock (ถ้ายังไม่มี) + รัน migration + seed
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // 1. เชื่อมต่อ default database เพื่อสร้าง solar_stock
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // เชื่อมต่อ default db ก่อน
  });

  try {
    const dbName = process.env.DB_NAME || 'solar_stock';

    // ตรวจสอบว่า database มีอยู่แล้วหรือไม่
    const checkResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      console.log(`🔧 Creating database "${dbName}"...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created!`);
    } else {
      console.log(`ℹ️  Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Error creating database:', err.message);
    process.exit(1);
  } finally {
    await adminPool.end();
  }

  // 2. เชื่อมต่อ solar_stock แล้วรัน migration
  const appPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'solar_stock',
  });

  try {
    const sqlPath = path.join(__dirname, 'src', 'migrations', '001_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Running migration...');
    await appPool.query(sql);
    console.log('✅ Migration completed!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await appPool.end();
  }

  console.log('\n🎉 Database setup complete! Now run: npm run seed');
}

setupDatabase();

/**
 * db.js — PostgreSQL Connection Pool
 * ใช้ pg Pool สำหรับจัดการ connection ไปยัง PostgreSQL
 */
const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '123456'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'solar_stock'}`,
  connectionTimeoutMillis: 10000,
  max: 10,
};

const pool = new Pool(poolConfig);

// ทดสอบ connection เมื่อเริ่มต้น
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

module.exports = pool;

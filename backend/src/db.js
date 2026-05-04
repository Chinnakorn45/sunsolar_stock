/**
 * db.js — PostgreSQL Connection Pool
 * ใช้ pg Pool สำหรับจัดการ connection ไปยัง PostgreSQL
 */
const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000, // ป้องกันการค้างจน Vercel Timeout
      max: 10, // จำกัด Connection Pool สำหรับ Serverless
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'solar_stock',
      connectionTimeoutMillis: 10000,
      max: 10,
    };

let pool;
try {
  pool = new Pool(poolConfig);
} catch (err) {
  console.error('❌ Failed to initialize PostgreSQL Pool:', err.message);
  // ป้องกันแอปพังตอน Startup ให้ใช้ Pool เปล่าๆ แทน
  pool = {
    query: async () => { throw new Error('Database connection string is invalid or not set correctly.'); },
    on: () => {},
  };
}

// ทดสอบ connection เมื่อเริ่มต้น
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

module.exports = pool;

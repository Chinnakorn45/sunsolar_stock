/**
 * seed-technicians.js — ข้อมูลช่างตัวอย่าง
 */
const pool = require('./src/db');

const technicians = [
  { name: 'สมชาย ใจดี', phone: '081-234-5678', role: 'ช่างติดตั้ง' },
  { name: 'สมหญิง รักงาน', phone: '089-876-5432', role: 'ช่างไฟฟ้า' },
  { name: 'ประเสริฐ มั่นคง', phone: '092-345-6789', role: 'หัวหน้าทีม' },
  { name: 'วิชัย เก่งกาจ', phone: '086-111-2222', role: 'ช่างติดตั้ง' },
  { name: 'อนันต์ สุขสบาย', phone: '095-333-4444', role: 'ช่างไฟฟ้า' },
];

async function seed() {
  try {
    console.log('🌱 Seeding technicians...');
    for (const t of technicians) {
      await pool.query(
        `INSERT INTO technicians (name, phone, role) VALUES ($1, $2, $3)`,
        [t.name, t.phone, t.role]
      );
    }
    console.log(`✅ Seeded ${technicians.length} technicians!`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();

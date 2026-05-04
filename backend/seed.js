/**
 * seed.js — ข้อมูลตัวอย่างอุปกรณ์โซลาร์เซลล์
 * รันด้วย: npm run seed
 */
const pool = require('./src/db');

const sampleProducts = [
  { name: 'Solar Panel 550W Mono', unit: 'แผ่น', reorder_point: 20 },
  { name: 'Solar Panel 450W Mono', unit: 'แผ่น', reorder_point: 15 },
  { name: 'Inverter 5kW Hybrid', unit: 'ตัว', reorder_point: 5 },
  { name: 'Inverter 10kW On-Grid', unit: 'ตัว', reorder_point: 3 },
  { name: 'MC4 Connector (คู่)', unit: 'คู่', reorder_point: 100 },
  { name: 'สาย PV Cable 4mm² (แดง)', unit: 'เมตร', reorder_point: 200 },
  { name: 'สาย PV Cable 4mm² (ดำ)', unit: 'เมตร', reorder_point: 200 },
  { name: 'Mounting Rail อลูมิเนียม 4.2m', unit: 'เส้น', reorder_point: 30 },
  { name: 'Mid Clamp 35mm', unit: 'ตัว', reorder_point: 50 },
  { name: 'End Clamp 35mm', unit: 'ตัว', reorder_point: 50 },
  { name: 'AC Breaker 32A', unit: 'ตัว', reorder_point: 10 },
  { name: 'DC Breaker 550V 32A', unit: 'ตัว', reorder_point: 10 },
  { name: 'Surge Protection Device (SPD)', unit: 'ตัว', reorder_point: 5 },
  { name: 'Battery LiFePO4 51.2V 100Ah', unit: 'ก้อน', reorder_point: 3 },
  { name: 'สายกราวด์ 10mm²', unit: 'เมตร', reorder_point: 100 },
];

async function seed() {
  try {
    console.log('🌱 Seeding products...');

    for (const product of sampleProducts) {
      await pool.query(
        `INSERT INTO products (name, unit, reorder_point)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [product.name, product.unit, product.reorder_point]
      );
    }

    console.log(`✅ Seeded ${sampleProducts.length} products successfully!`);

    // --- เพิ่มธุรกรรมตัวอย่าง (สำหรับ demo) ---
    console.log('🌱 Seeding sample transactions...');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // ธุรกรรมเมื่อวาน (สร้างยอดยกมา)
    const pastTransactions = [
      { product_name: 'Solar Panel 550W Mono', type: 'IN', quantity: 50, job_name: 'รับสินค้าจาก Supplier A', date: yesterday },
      { product_name: 'Inverter 5kW Hybrid', type: 'IN', quantity: 10, job_name: 'รับสินค้าจาก Supplier B', date: yesterday },
      { product_name: 'MC4 Connector (คู่)', type: 'IN', quantity: 200, job_name: 'รับสินค้าจาก Supplier A', date: yesterday },
      { product_name: 'Mounting Rail อลูมิเนียม 4.2m', type: 'IN', quantity: 40, job_name: 'รับสินค้าจาก Supplier C', date: yesterday },
      { product_name: 'Solar Panel 550W Mono', type: 'OUT', quantity: 12, job_name: 'โปรเจกต์ บ้านคุณสมชาย', date: yesterday },
      { product_name: 'Inverter 5kW Hybrid', type: 'OUT', quantity: 2, job_name: 'โปรเจกต์ บ้านคุณสมชาย', date: yesterday },
    ];

    // ธุรกรรมวันนี้
    const todayTransactions = [
      { product_name: 'Solar Panel 550W Mono', type: 'IN', quantity: 30, job_name: 'รับสินค้าเพิ่มจาก Supplier A', date: today },
      { product_name: 'Solar Panel 550W Mono', type: 'OUT', quantity: 8, job_name: 'โปรเจกต์ โรงงาน ABC', date: today },
      { product_name: 'MC4 Connector (คู่)', type: 'OUT', quantity: 24, job_name: 'โปรเจกต์ โรงงาน ABC', date: today },
      { product_name: 'Inverter 5kW Hybrid', type: 'OUT', quantity: 1, job_name: 'โปรเจกต์ โรงงาน ABC', date: today },
    ];

    const allTransactions = [...pastTransactions, ...todayTransactions];

    for (const tx of allTransactions) {
      // หา product_id จากชื่อ
      const prodResult = await pool.query('SELECT id FROM products WHERE name = $1', [tx.product_name]);
      if (prodResult.rows.length > 0) {
        await pool.query(
          `INSERT INTO stock_transactions (product_id, type, quantity, job_name, transaction_date)
           VALUES ($1, $2, $3, $4, $5)`,
          [prodResult.rows[0].id, tx.type, tx.quantity, tx.job_name, tx.date]
        );
      }
    }

    console.log(`✅ Seeded ${allTransactions.length} transactions successfully!`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();

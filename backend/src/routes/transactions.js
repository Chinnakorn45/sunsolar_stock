/**
 * transactions.js — API Routes สำหรับธุรกรรมสต๊อก + รายงานรายวัน
 *
 * POST /api/transactions                    — บันทึก IN/OUT
 * GET  /api/transactions?date=YYYY-MM-DD    — ดึงธุรกรรมตามวัน
 * GET  /api/reports/daily-summary?date=...  — สรุปรายวันพร้อมยอดยกมา
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * POST /api/transactions
 * บันทึกการนำเข้า (IN) หรือจ่ายออก (OUT)
 * Body: { product_id, type, quantity, job_name?, note?, transaction_date?, technician_id? }
 */
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      type,
      quantity,
      job_name = '',
      note = '',
      transaction_date, // optional — ถ้าไม่ส่งจะใช้ CURRENT_DATE
      technician_id = null, // optional — เฉพาะ OUT: ช่างที่รับอุปกรณ์
    } = req.body;

    // --- Validation ---
    if (!product_id || !type || !quantity) {
      return res.status(400).json({ error: 'product_id, type, and quantity are required' });
    }
    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ error: 'type must be "IN" or "OUT"' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be greater than 0' });
    }

    // --- ตรวจสอบว่าสินค้ามีอยู่จริง ---
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // --- บันทึกธุรกรรม ---
    const dateValue = transaction_date || new Date().toISOString().split('T')[0];
    const techId = type === 'OUT' && technician_id ? technician_id : null;
    const result = await pool.query(
      `INSERT INTO stock_transactions (product_id, type, quantity, job_name, note, transaction_date, technician_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product_id, type, quantity, job_name.trim(), note.trim(), dateValue, techId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating transaction:', err.message);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

/**
 * GET /api/transactions?date=YYYY-MM-DD
 * ดึงรายการธุรกรรมของวันที่ระบุ พร้อมชื่ออุปกรณ์
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT st.*, p.name AS product_name, p.unit,
              t.name AS technician_name
       FROM stock_transactions st
       JOIN products p ON p.id = st.product_id
       LEFT JOIN technicians t ON t.id = st.technician_id
       WHERE st.transaction_date = $1
       ORDER BY st.created_at DESC`,
      [targetDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/reports/daily-summary?date=YYYY-MM-DD
 *
 * สรุปรายงานรายวัน — สำหรับทุกสินค้า:
 *  1. ยอดยกมา (Balance Forward) = ผลรวม IN - OUT ก่อนวันที่ระบุ
 *  2. เข้า (total_in)  = ผลรวม IN ของวันนั้น
 *  3. ออก (total_out) = ผลรวม OUT ของวันนั้น
 *  4. คงเหลือสุทธิ (net_balance) = ยอดยกมา + เข้า - ออก
 */
router.get('/daily-summary', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.unit,
         p.reorder_point,
         p.image_url,

         -- ยอดยกมา: รวม IN-OUT ก่อนวันที่ระบุ
         COALESCE(SUM(CASE
           WHEN st.transaction_date < $1 AND st.type = 'IN'  THEN st.quantity
           WHEN st.transaction_date < $1 AND st.type = 'OUT' THEN -st.quantity
           ELSE 0
         END), 0)::int AS balance_forward,

         -- เข้าของวันนี้
         COALESCE(SUM(CASE
           WHEN st.transaction_date = $1 AND st.type = 'IN' THEN st.quantity
           ELSE 0
         END), 0)::int AS total_in,

         -- ออกของวันนี้
         COALESCE(SUM(CASE
           WHEN st.transaction_date = $1 AND st.type = 'OUT' THEN st.quantity
           ELSE 0
         END), 0)::int AS total_out,

         -- คงเหลือสุทธิ = ยอดยกมา + เข้า - ออก
         COALESCE(SUM(CASE
           WHEN st.transaction_date <= $1 AND st.type = 'IN'  THEN st.quantity
           WHEN st.transaction_date <= $1 AND st.type = 'OUT' THEN -st.quantity
           ELSE 0
         END), 0)::int AS net_balance

       FROM products p
       LEFT JOIN stock_transactions st ON st.product_id = p.id
       GROUP BY p.id, p.name, p.unit, p.reorder_point, p.image_url
       ORDER BY p.name ASC`,
      [targetDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error generating daily summary:', err.message);
    res.status(500).json({ error: 'Failed to generate daily summary' });
  }
});

/**
 * GET /history
 * ดึงรายการธุรกรรมทั้งหมด (ประวัติรายการ)
 */
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let queryStr = `
      SELECT st.*, p.name AS product_name, p.unit,
              t.name AS technician_name
       FROM stock_transactions st
       JOIN products p ON p.id = st.product_id
       LEFT JOIN technicians t ON t.id = st.technician_id
    `;
    const params = [];

    if (startDate && endDate) {
      queryStr += ` WHERE st.transaction_date >= $1 AND st.transaction_date <= $2 `;
      params.push(startDate, endDate);
    } else if (startDate) {
      queryStr += ` WHERE st.transaction_date >= $1 `;
      params.push(startDate);
    } else if (endDate) {
      queryStr += ` WHERE st.transaction_date <= $1 `;
      params.push(endDate);
    }

    queryStr += ` ORDER BY st.transaction_date DESC, st.created_at DESC`;

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transaction history:', err.message);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

/**
 * GET /inventory-overview
 * สรุปสต๊อกทั้งหมดแบบภาพรวม (All-time)
 */
router.get('/inventory-overview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.unit,
         p.reorder_point,
         p.image_url,
         COALESCE(SUM(CASE WHEN st.type = 'IN' THEN st.quantity ELSE 0 END), 0)::int AS total_in,
         COALESCE(SUM(CASE WHEN st.type = 'OUT' THEN st.quantity ELSE 0 END), 0)::int AS total_out,
         COALESCE(SUM(CASE WHEN st.type = 'IN' THEN st.quantity WHEN st.type = 'OUT' THEN -st.quantity ELSE 0 END), 0)::int AS net_balance
      FROM products p
      LEFT JOIN stock_transactions st ON st.product_id = p.id
      GROUP BY p.id, p.name, p.unit, p.reorder_point, p.image_url
      ORDER BY p.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error generating inventory overview:', err.message);
    res.status(500).json({ error: 'Failed to generate inventory overview' });
  }
});

module.exports = router;

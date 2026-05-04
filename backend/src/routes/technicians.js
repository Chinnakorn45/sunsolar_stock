/**
 * technicians.js — API Routes สำหรับจัดการรายชื่อช่าง (CRUD)
 *
 * GET    /api/technicians       — ดึงรายชื่อช่างทั้งหมด
 * POST   /api/technicians       — เพิ่มช่างใหม่
 * PUT    /api/technicians/:id   — แก้ไขข้อมูลช่าง
 * DELETE /api/technicians/:id   — ลบช่าง
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/technicians
 * ดึงรายชื่อช่างทั้งหมด (เรียงตามชื่อ, เฉพาะที่ active หรือทั้งหมด)
 * Query: ?all=true เพื่อดึงรวม inactive ด้วย
 */
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const whereClause = showAll ? '' : 'WHERE is_active = true';
    const result = await pool.query(
      `SELECT id, name, phone, role, is_active, created_at
       FROM technicians ${whereClause}
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching technicians:', err.message);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

/**
 * POST /api/technicians
 * เพิ่มช่างใหม่
 * Body: { name: string, phone?: string, role?: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone = '', role = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      `INSERT INTO technicians (name, phone, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), phone.trim(), role.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating technician:', err.message);
    res.status(500).json({ error: 'Failed to create technician' });
  }
});

/**
 * PUT /api/technicians/:id
 * แก้ไขข้อมูลช่าง
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      `UPDATE technicians
       SET name = $1, phone = $2, role = $3, is_active = $4
       WHERE id = $5
       RETURNING *`,
      [name.trim(), (phone || '').trim(), (role || '').trim(), is_active ?? true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating technician:', err.message);
    res.status(500).json({ error: 'Failed to update technician' });
  }
});

/**
 * DELETE /api/technicians/:id
 * ลบช่าง (ธุรกรรมที่อ้างอิงจะ SET NULL)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM technicians WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json({ message: 'Technician deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting technician:', err.message);
    res.status(500).json({ error: 'Failed to delete technician' });
  }
});

module.exports = router;

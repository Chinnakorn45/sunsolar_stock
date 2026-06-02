/**
 * index.js — Express Server Entry Point
 * ระบบจัดการสต๊อกอุปกรณ์โซลาร์เซลล์
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// URL ของ Frontend (Netlify) — ใช้สำหรับ redirect เมื่อเข้าผ่าน Render URL โดยตรง
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sunsolar-stock.vercel.app';

// --- Middleware ---
app.use(cors({
  origin: '*',           // อนุญาตทุก origin (Netlify, localhost)
  credentials: false,
}));
app.use(express.json());

// Serve uploaded images (รูปอุปกรณ์)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Routes ---
const productsRouter = require('./routes/products');
const transactionsRouter = require('./routes/transactions');
const techniciansRouter = require('./routes/technicians');

app.use('/api/products', productsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/technicians', techniciansRouter);

// Daily summary ใช้ path แยกจาก transactions
// แต่อยู่ใน router เดียวกัน → /api/reports/daily-summary
app.use('/api/reports', transactionsRouter);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Solar Stock API is running 🌞' });
});

// --- Catch-all: redirect non-API routes ไป Frontend ---
// ป้องกัน 404 เมื่อผู้ใช้รีเฟรช /stock, /summary, /products ฯลฯ บน Render URL โดยตรง
app.get('*', (req, res) => {
  // ถ้าเป็น API path ที่ไม่เจอ → 404 JSON ปกติ
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `API route not found: ${req.path}` });
  }
  // Non-API route → redirect ไป Netlify Frontend
  res.redirect(301, `${FRONTEND_URL}${req.path}${req.search || ''}`);
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌞 Solar Stock API running on http://0.0.0.0:${PORT}`);
});

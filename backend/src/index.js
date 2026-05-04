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

// --- Middleware ---
app.use(cors());                        // อนุญาต Cross-Origin requests
app.use(express.json());                 // Parse JSON body

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

// --- Start Server (เฉพาะรันบนเครื่อง Local) ---
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🌞 Solar Stock API running on http://localhost:${PORT}`);
  });
}

// Export app สำหรับ Vercel Serverless
module.exports = app;

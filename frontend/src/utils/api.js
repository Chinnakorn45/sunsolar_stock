// utils/api.js
// ใช้ /api เสมอ — ให้ proxy จัดการ:
//   - Local dev  → Vite proxy ใน vite.config.js ส่งต่อไป localhost:5000
//   - Netlify    → Netlify redirect proxy ส่งต่อไป sunsolar-stock.onrender.com
// ถ้ากำหนด VITE_API_BASE ใน env ก็จะใช้ค่านั้นแทน (override)

const rawApiBase = import.meta.env.VITE_API_BASE?.trim();

export const API_BASE = rawApiBase
  ? rawApiBase.replace(/\/+$/, '').replace(/\/api$/, '') + '/api'
  : '/api';


// utils/api.js
// ลำดับการตรวจสอบ API Base URL:
// 1. VITE_API_BASE env var (ตั้งค่าใน Netlify/Vercel dashboard)
// 2. ถ้า deploy บน Netlify/Vercel → ยิงตรงไป Render backend (proxy อาจไม่เสถียร)
// 3. ถ้ารันบน localhost → ใช้ /api (vite proxy หรือ nginx จัดการ)

const RENDER_BACKEND = 'https://sunsolar-stock.onrender.com/api';

const rawApiBase = import.meta.env.VITE_API_BASE?.trim();

function detectApiBase() {
  // ถ้ากำหนด env ไว้ชัดเจน → ใช้เลย
  if (rawApiBase) {
    return rawApiBase.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
  }

  // ตรวจสอบว่ารันบน production hosting หรือเปล่า
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');

    if (!isLocalhost) {
      // Deploy บน Netlify, Vercel หรือ hosting อื่น → ยิงตรงไป Render
      return RENDER_BACKEND;
    }
  }

  // Local development → ใช้ relative path (vite dev proxy / nginx)
  return '/api';
}

export const API_BASE = detectApiBase();

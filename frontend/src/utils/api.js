// utils/api.js
// Frontend uses Vite env `VITE_API_BASE` when provided, otherwise falls back
// to the relative `/api` path. On Vercel, if env is not set, use the
// external Render backend URL directly for API calls.
const rawApiBase = import.meta.env.VITE_API_BASE?.trim();

const fallbackApiBase = typeof window !== 'undefined' && window.location.hostname === 'sunsolar-stock.vercel.app'
  ? 'https://sunsolar-stock.onrender.com/api'
  : '/api';

const normalizedApiBase = rawApiBase
  ? rawApiBase.replace(/\/+$|\/api$/, '').replace(/\/api$/, '') + '/api'
  : fallbackApiBase;

export const API_BASE = normalizedApiBase;

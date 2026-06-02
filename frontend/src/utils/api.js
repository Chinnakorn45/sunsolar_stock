// utils/api.js
// Frontend uses Vite env `VITE_API_BASE` when provided, otherwise falls back
// to the relative `/api` path (for proxy environments such as Vercel rewrites
// or local Docker/Nginx setups).
const rawApiBase = import.meta.env.VITE_API_BASE?.trim();
const normalizedApiBase = rawApiBase
  ? rawApiBase.replace(/\/+$/, '').replace(/\/api$/, '') + '/api'
  : '/api';

export const API_BASE = normalizedApiBase;

// utils/api.js
// Frontend uses Vite env `VITE_API_BASE` when provided (set on Netlify
// or in local `.env`), otherwise falls back to the relative `/api` path
// (when running behind a proxy such as the project's Nginx in Docker).
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

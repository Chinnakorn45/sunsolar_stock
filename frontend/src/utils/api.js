// utils/api.js
// ดึงค่า URL ของ Backend จาก Environment Variable ของ Vite/Vercel
// ถ้าไม่มี (เช่น รันในเครื่อง Local) จะใช้ '/api' เป็นค่าเริ่มต้น (ซึ่ง Vite จะจัดการ Proxy ให้)
export const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

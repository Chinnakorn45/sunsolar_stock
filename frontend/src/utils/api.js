// utils/api.js
// ดึงค่า URL ของ Backend จาก Environment Variable ของ Vite/Vercel
// ถ้าไม่มี (เช่น รันในเครื่อง Local) จะใช้ '/api' เป็นค่าเริ่มต้น (ซึ่ง Vite จะจัดการ Proxy ให้)
export const API_BASE = import.meta.env.MODE === 'production' 
  ? 'https://sunsolar-stock-4s8r-4op2zqxhh-chinnakorn45s-projects.vercel.app/api' 
  : '/api';

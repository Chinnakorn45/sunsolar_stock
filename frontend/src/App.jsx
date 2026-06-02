/**
 * App.jsx — Main Router
 * 4 หน้าหลัก: บันทึกรายการ (/) + สรุปรายวัน (/summary) + จัดการอุปกรณ์ (/products) + จัดการช่าง (/technicians)
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import DailySummary from './pages/DailySummary';
import InventoryOverview from './pages/InventoryOverview';
import ProductManagement from './pages/ProductManagement';
import TechnicianManagement from './pages/TechnicianManagement';
import TransactionForm from './pages/TransactionForm';
import TransactionHistory from './pages/TransactionHistory';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<TransactionForm />} />
            <Route path="/summary" element={<DailySummary />} />
            <Route path="/overview" element={<InventoryOverview />} />
            <Route path="/history" element={<TransactionHistory />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/technicians" element={<TechnicianManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-600 border-t border-slate-800/50">
          ☀️ Solar Stock Management System © {new Date().getFullYear()}
        </footer>
      </div>
    </BrowserRouter>
  );
}

/**
 * Navbar.jsx — Navigation Bar
 * Solar-themed top navigation with responsive mobile menu
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-solar-500/20 text-solar-400 border border-solar-500/30'
        : 'text-slate-400 hover:text-solar-300 hover:bg-white/5'
    }`;

  return (
    <nav className="glass-card !rounded-none border-x-0 border-t-0 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/95 border border-slate-200 shadow-sm">
              <img src="/logo.png" alt="Solar Stock" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Solar Stock</h1>
              <p className="text-[10px] text-slate-500 leading-tight">Equipment Management</p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center gap-2">
            <NavLink to="/" className={linkClass} end>
              📋 บันทึกรายการ
            </NavLink>
            <NavLink to="/summary" className={linkClass}>
              📊 สรุปรายวัน
            </NavLink>
            <NavLink to="/overview" className={linkClass}>
              📦 ภาพรวม
            </NavLink>
            <NavLink to="/stock" className={linkClass}>
              🗂️ สต๊อก
            </NavLink>
            <NavLink to="/history" className={linkClass}>
              📜 ประวัติ
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              ⚙️ จัดการอุปกรณ์
            </NavLink>
            <NavLink to="/technicians" className={linkClass}>
              👷 จัดการช่าง
            </NavLink>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-solar-400 hover:bg-white/5 transition-colors"
            aria-label="เปิดเมนู"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="sm:hidden pb-4 animate-slide-down">
            <div className="flex flex-col gap-2">
              <NavLink to="/" className={linkClass} end onClick={() => setMobileOpen(false)}>
                📋 บันทึกรายการ
              </NavLink>
              <NavLink to="/summary" className={linkClass} onClick={() => setMobileOpen(false)}>
                📊 สรุปรายวัน
              </NavLink>
              <NavLink to="/overview" className={linkClass} onClick={() => setMobileOpen(false)}>
                📦 ภาพรวม
              </NavLink>
              <NavLink to="/stock" className={linkClass} onClick={() => setMobileOpen(false)}>
                🗂️ สต๊อก
              </NavLink>
              <NavLink to="/history" className={linkClass} onClick={() => setMobileOpen(false)}>
                📜 ประวัติ
              </NavLink>
              <NavLink to="/products" className={linkClass} onClick={() => setMobileOpen(false)}>
                ⚙️ จัดการอุปกรณ์
              </NavLink>
              <NavLink to="/technicians" className={linkClass} onClick={() => setMobileOpen(false)}>
                👷 จัดการช่าง
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

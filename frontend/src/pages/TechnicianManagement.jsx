/**
 * TechnicianManagement.jsx — หน้าจัดการรายชื่อช่าง
 * เพิ่ม / แก้ไข / ลบ ช่างผู้รับอุปกรณ์
 */
import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

export default function TechnicianManagement() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchTechnicians(); }, []);

  async function fetchTechnicians() {
    try {
      const res = await fetch(`${API_BASE}/technicians?all=true`);
      const data = await res.json();
      setTechnicians(data);
    } catch (err) {
      showToast('โหลดรายชื่อช่างไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleAdd() {
    setEditing(null);
    setFormName(''); setFormPhone(''); setFormRole('');
    setModalOpen(true);
  }

  function handleEdit(tech) {
    setEditing(tech);
    setFormName(tech.name);
    setFormPhone(tech.phone || '');
    setFormRole(tech.role || '');
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formName.trim()) return showToast('กรุณากรอกชื่อช่าง', 'error');

    setSubmitting(true);
    try {
      const body = { name: formName.trim(), phone: formPhone.trim(), role: formRole.trim() };

      let res;
      if (editing) {
        body.is_active = editing.is_active;
        res = await fetch(`${API_BASE}/technicians/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/technicians`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }

      showToast(editing ? `✅ แก้ไข "${formName}" สำเร็จ` : `✅ เพิ่ม "${formName}" สำเร็จ`);
      handleCloseModal();
      fetchTechnicians();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle active/inactive
  async function toggleActive(tech) {
    try {
      const res = await fetch(`${API_BASE}/technicians/${tech.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tech, is_active: !tech.is_active }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`${tech.name} — ${tech.is_active ? 'ปิดใช้งานแล้ว' : 'เปิดใช้งานแล้ว'}`);
      fetchTechnicians();
    } catch (err) {
      showToast('เปลี่ยนสถานะไม่สำเร็จ', 'error');
    }
  }

  async function handleDelete(tech) {
    try {
      const res = await fetch(`${API_BASE}/technicians/${tech.id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      showToast(`✅ ลบ "${tech.name}" สำเร็จ`);
      setDeleteConfirm(null);
      fetchTechnicians();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  }

  const filtered = technicians.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">👷 จัดการรายชื่อช่าง</h2>
          <p className="text-slate-500 text-sm">เพิ่ม แก้ไข ลบ รายชื่อช่างผู้รับอุปกรณ์ ({technicians.length} คน)</p>
        </div>
        <button onClick={handleAdd} className="btn-primary whitespace-nowrap">
          ➕ เพิ่มช่าง
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 ค้นหาช่าง (ชื่อ / ตำแหน่ง)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-solar-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">กำลังโหลด...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">👷</p>
            <p className="text-slate-400">{search ? 'ไม่พบช่างที่ค้นหา' : 'ยังไม่มีรายชื่อช่าง'}</p>
          </div>
        ) : (
          filtered.map((tech) => (
            <div
              key={tech.id}
              className={`glass-card glass-card-hover p-4 sm:p-5 flex items-center justify-between gap-3 ${
                !tech.is_active ? 'opacity-50' : ''
              }`}
            >
              {/* Info */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                  tech.is_active
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-slate-700/50 border border-slate-600/20'
                }`}>
                  👷
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{tech.name}</h3>
                    {!tech.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 border border-slate-300">ปิดใช้งาน</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {tech.role && (
                      <span className="text-xs text-slate-500">
                        ตำแหน่ง: <span className="text-solar-600 font-medium">{tech.role}</span>
                      </span>
                    )}
                    {tech.phone && (
                      <span className="text-xs text-slate-500">
                        📱 <span className="text-slate-600">{tech.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => toggleActive(tech)}
                  className={`p-2 rounded-lg transition-all ${
                    tech.is_active
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-slate-500 hover:bg-slate-500/10'
                  }`}
                  title={tech.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {tech.is_active ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </button>
                {/* Edit */}
                <button
                  onClick={() => handleEdit(tech)}
                  className="p-2 rounded-lg text-slate-400 hover:text-solar-400 hover:bg-solar-500/10 transition-all"
                  title="แก้ไข"
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {/* Delete */}
                <button
                  onClick={() => setDeleteConfirm(tech)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="ลบ"
                >
                  <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== Modal: เพิ่ม/แก้ไข ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleCloseModal} />
          <div className="glass-card relative w-full max-w-md p-6 sm:p-8 animate-fade-in-up z-10 border-solar-500/20">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {editing ? '✏️ แก้ไขช่าง' : '➕ เพิ่มช่างใหม่'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="tech-name" className="block text-sm font-medium text-slate-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-400">*</span>
                </label>
                <input id="tech-name" type="text" className="form-input" placeholder="เช่น สมชาย ใจดี"
                  value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus required />
              </div>
              <div className="mb-4">
                <label htmlFor="tech-phone" className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทร</label>
                <input id="tech-phone" type="text" className="form-input" placeholder="เช่น 081-234-5678"
                  value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
              <div className="mb-6">
                <label htmlFor="tech-role" className="block text-sm font-medium text-slate-700 mb-2">ตำแหน่ง / ทีม</label>
                <input id="tech-role" type="text" className="form-input" placeholder="เช่น ช่างติดตั้ง, หัวหน้าทีม"
                  value={formRole} onChange={(e) => setFormRole(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : editing ? '💾 บันทึก' : '➕ เพิ่มช่าง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal: ยืนยันลบ ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfirm(null)} />
          <div className="glass-card relative w-full max-w-sm p-6 animate-fade-in-up z-10 border-red-500/20">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ยืนยันการลบ</h3>
              <p className="text-sm text-slate-600">
                ต้องการลบ <span className="text-slate-900 font-semibold">"{deleteConfirm.name}"</span> ใช่ไหม?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium">
                ยกเลิก
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium text-sm hover:from-red-500 hover:to-red-400 transition-all">
                🗑️ ลบเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

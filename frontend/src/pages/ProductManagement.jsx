/**
 * ProductManagement.jsx — หน้าจัดการอุปกรณ์
 * เพิ่ม / แก้ไข / ลบ รายการอุปกรณ์โซลาร์เซลล์ + อัปโหลดรูปภาพ
 */
import { useState, useEffect, useRef } from 'react';

import { API_BASE } from '../utils/api';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formReorderPoint, setFormReorderPoint] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      showToast('โหลดรายการอุปกรณ์ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // --- เลือกรูปภาพ ---
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('ไฟล์ใหญ่เกิน 5MB', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // --- เปิด Modal ---
  function handleAdd() {
    setEditingProduct(null);
    setFormName(''); setFormUnit(''); setFormReorderPoint('0');
    clearImage();
    setModalOpen(true);
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setFormName(product.name);
    setFormUnit(product.unit);
    setFormReorderPoint(String(product.reorder_point));
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingProduct(null);
    clearImage();
  }

  // --- Submit (เพิ่ม/แก้ไข — ใช้ FormData เพื่อส่งรูป) ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formName.trim() || !formUnit.trim()) return showToast('กรุณากรอกชื่อและหน่วยนับ', 'error');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('unit', formUnit.trim());
      formData.append('reorder_point', parseInt(formReorderPoint, 10) || 0);
      if (imageFile) formData.append('image', imageFile);

      let res;
      if (editingProduct) {
        res = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
          method: 'PUT', body: formData,
        });
      } else {
        res = await fetch(`${API_BASE}/products`, {
          method: 'POST', body: formData,
        });
      }

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }

      showToast(editingProduct ? `✅ แก้ไข "${formName}" สำเร็จ` : `✅ เพิ่ม "${formName}" สำเร็จ`);
      handleCloseModal();
      fetchProducts();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // --- ลบ ---
  async function handleDelete(product) {
    try {
      const res = await fetch(`${API_BASE}/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const result = await res.json();
      const txnNote = result.transactions_deleted > 0 ? ` (ลบธุรกรรม ${result.transactions_deleted} รายการ)` : '';
      showToast(`✅ ลบ "${product.name}" สำเร็จ${txnNote}`);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      showToast(`❌ ลบไม่สำเร็จ: ${err.message}`, 'error');
    }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // --- สร้าง image src (รองรับทั้ง relative path และ full URL) ---
  function getImageSrc(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl; // /uploads/... จะถูก proxy ไปที่ backend
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">⚙️ จัดการอุปกรณ์</h2>
          <p className="text-slate-400 text-sm">เพิ่ม แก้ไข ลบ รายการอุปกรณ์โซลาร์เซลล์ ({products.length} รายการ)</p>
        </div>
        <button onClick={handleAdd} className="btn-primary whitespace-nowrap">➕ เพิ่มอุปกรณ์</button>
      </div>

      {/* Search */}
      <div className="mb-5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <input type="text" className="form-input" placeholder="🔍 ค้นหาอุปกรณ์..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Product List */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-solar-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">กำลังโหลด...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">{search ? 'ไม่พบอุปกรณ์ที่ค้นหา' : 'ยังไม่มีอุปกรณ์'}</p>
          </div>
        ) : (
          filtered.map((product) => (
            <div key={product.id} className="glass-card glass-card-hover p-4 sm:p-5 flex items-center justify-between gap-3">
              {/* รูป + ข้อมูล */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Product Image */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-surface-700 border border-slate-700/50 shrink-0 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={getImageSrc(product.image_url)} alt={product.name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl opacity-40">📦</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate">{product.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500">หน่วย: <span className="text-slate-400">{product.unit}</span></span>
                    <span className="text-xs text-slate-500">จุดสั่งซื้อ: <span className="text-solar-400 font-medium">{product.reorder_point}</span></span>
                  </div>
                </div>
              </div>

              {/* ปุ่ม */}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleEdit(product)}
                  className="p-2 rounded-lg text-slate-400 hover:text-solar-400 hover:bg-solar-500/10 transition-all" title="แก้ไข">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteConfirm(product)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="ลบ">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== Modal: เพิ่ม/แก้ไข + Image Upload ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleCloseModal} />
          <div className="glass-card relative w-full max-w-md p-6 sm:p-8 animate-fade-in-up z-10 border-solar-500/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingProduct ? '✏️ แก้ไขอุปกรณ์' : '➕ เพิ่มอุปกรณ์ใหม่'}
            </h3>
            <form onSubmit={handleSubmit}>
              {/* รูปภาพ */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">รูปภาพอุปกรณ์</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-700 border-2 border-dashed border-slate-600 shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-30">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-white/5 hover:border-solar-500/40 transition-all cursor-pointer">
                      📁 เลือกรูป
                    </label>
                    {imagePreview && (
                      <button type="button" onClick={clearImage}
                        className="ml-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                        ✕ ลบรูป
                      </button>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500">JPG, PNG, WebP — ไม่เกิน 5MB</p>
                  </div>
                </div>
              </div>

              {/* ชื่อ */}
              <div className="mb-4">
                <label htmlFor="modal-name" className="block text-sm font-medium text-slate-300 mb-2">
                  ชื่ออุปกรณ์ <span className="text-red-400">*</span>
                </label>
                <input id="modal-name" type="text" className="form-input" placeholder="เช่น Solar Panel 550W Mono"
                  value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus required />
              </div>

              {/* หน่วย */}
              <div className="mb-4">
                <label htmlFor="modal-unit" className="block text-sm font-medium text-slate-300 mb-2">
                  หน่วยนับ <span className="text-red-400">*</span>
                </label>
                <input id="modal-unit" type="text" className="form-input" placeholder="เช่น แผ่น, ตัว, เส้น"
                  value={formUnit} onChange={(e) => setFormUnit(e.target.value)} required />
              </div>

              {/* จุดสั่งซื้อ */}
              <div className="mb-6">
                <label htmlFor="modal-reorder" className="block text-sm font-medium text-slate-300 mb-2">จุดสั่งซื้อซ้ำ (Reorder Point)</label>
                <input id="modal-reorder" type="number" min="0" className="form-input" placeholder="0"
                  value={formReorderPoint} onChange={(e) => setFormReorderPoint(e.target.value)} />
                <p className="mt-1 text-xs text-slate-500">ระบบจะเตือนเมื่อคงเหลือต่ำกว่าจำนวนนี้</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button type="button" onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : editingProduct ? '💾 บันทึก' : '➕ เพิ่มอุปกรณ์'}
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
              <h3 className="text-lg font-bold text-white mb-2">ยืนยันการลบ</h3>
              <p className="text-sm text-slate-400">
                ต้องการลบ <span className="text-white font-medium">"{deleteConfirm.name}"</span> ใช่ไหม?
              </p>
              <p className="text-xs text-red-400/80 mt-2">⚠️ ธุรกรรมที่เกี่ยวข้องจะถูกลบทั้งหมด</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium">
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

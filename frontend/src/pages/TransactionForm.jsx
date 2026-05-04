/**
 * TransactionForm.jsx — หน้าบันทึกการรับ/เบิกอุปกรณ์
 * Form สำหรับบันทึกธุรกรรม IN (นำเข้า) / OUT (จ่ายออก)
 */
import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

export default function TransactionForm() {
  // --- State ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form fields
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [jobName, setJobName] = useState('');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Technician (เฉพาะ OUT)
  const [technicians, setTechnicians] = useState([]);
  const [technicianId, setTechnicianId] = useState('');

  // Recent transactions (แสดงรายการล่าสุดที่เพิ่งบันทึก)
  const [recentTxns, setRecentTxns] = useState([]);

  // --- โหลดรายการอุปกรณ์ + ช่าง ---
  useEffect(() => {
    fetchProducts();
    fetchTechnicians();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/reports/inventory-overview`);
      const data = await res.json();
      const mapped = data.map(p => ({
        ...p,
        id: p.product_id,
        name: p.product_name,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast('โหลดรายการอุปกรณ์ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTechnicians() {
    try {
      const res = await fetch(`${API_BASE}/technicians`);
      const data = await res.json();
      setTechnicians(data);
    } catch (err) {
      console.error('Failed to load technicians:', err);
    }
  }

  // --- แสดง Toast ---
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // --- Submit Form ---
  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!productId) return showToast('กรุณาเลือกอุปกรณ์', 'error');
    if (!quantity || parseInt(quantity) <= 0) return showToast('กรุณาระบุจำนวนที่ถูกต้อง', 'error');

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(productId),
          type,
          quantity: parseInt(quantity),
          job_name: jobName,
          note,
          transaction_date: transactionDate,
          technician_id: type === 'OUT' && technicianId ? parseInt(technicianId) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Unknown error');
      }

      const txn = await res.json();

      // หาชื่อสินค้าเพื่อแสดงใน recent list
      const product = products.find((p) => p.id === parseInt(productId));
      const tech = technicians.find((t) => t.id === parseInt(technicianId));
      setRecentTxns((prev) => [
        {
          ...txn,
          product_name: product?.name || '',
          product_unit: product?.unit || '',
          technician_name: tech?.name || '',
        },
        ...prev.slice(0, 4), // เก็บ 5 รายการล่าสุด
      ]);

      // หักลบ/เพิ่ม net_balance ชั่วคราวเพื่อให้ Alert อัปเดตทันที
      setProducts(prev => prev.map(p => {
        if (p.id === parseInt(productId)) {
          return {
            ...p,
            net_balance: type === 'IN' ? p.net_balance + parseInt(quantity) : p.net_balance - parseInt(quantity)
          };
        }
        return p;
      }));

      // Reset form (เก็บ type, date, jobName ไว้เพราะมักจะบันทึกหลายรายการต่อกัน)
      setProductId('');
      setQuantity('');
      setNote('');

      showToast(
        `✅ บันทึก${type === 'IN' ? 'นำเข้า' : 'จ่ายออก'} ${product?.name} จำนวน ${quantity} ${product?.unit} สำเร็จ!`
      );
    } catch (err) {
      showToast(`❌ บันทึกไม่สำเร็จ: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ---
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          📋 บันทึกรายการ
        </h2>
        <p className="text-slate-400 text-sm">
          บันทึกการรับเข้าหรือเบิกจ่ายอุปกรณ์โซลาร์เซลล์
        </p>
      </div>

      {/* Low Stock Alert */}
      {products.filter(p => p.reorder_point > 0 && p.net_balance <= p.reorder_point).length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-400 font-semibold text-sm mb-2">แจ้งเตือน: อุปกรณ์ใกล้หมดสต๊อก</h3>
              <div className="text-xs text-red-300/80 flex flex-wrap gap-2">
                {products.filter(p => p.reorder_point > 0 && p.net_balance <= p.reorder_point).map(p => (
                  <span key={p.id} className="bg-red-500/20 px-2 py-1 rounded border border-red-500/20">
                    {p.name} (เหลือ {p.net_balance} {p.unit})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

        {/* ประเภท IN / OUT */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">ประเภทรายการ</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${type === 'IN' ? 'active-in' : ''}`}
              onClick={() => setType('IN')}
            >
              📥 นำเข้า (IN)
            </button>
            <button
              type="button"
              className={`toggle-btn ${type === 'OUT' ? 'active-out' : ''}`}
              onClick={() => setType('OUT')}
            >
              📤 จ่ายออก (OUT)
            </button>
          </div>
        </div>

        {/* เลือกอุปกรณ์ */}
        <div className="mb-5">
          <label htmlFor="product-select" className="block text-sm font-medium text-slate-300 mb-2">
            อุปกรณ์ <span className="text-red-400">*</span>
          </label>
          {loading ? (
            <div className="form-input animate-pulse bg-surface-700">กำลังโหลด...</div>
          ) : (
            <select
              id="product-select"
              className="form-select"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">— เลือกอุปกรณ์ —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ช่างผู้รับ (เฉพาะ OUT) */}
        {type === 'OUT' && (
          <div className="mb-5">
            <label htmlFor="technician-select" className="block text-sm font-medium text-slate-300 mb-2">
              ช่างผู้รับอุปกรณ์
            </label>
            <select
              id="technician-select"
              className="form-select"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">— เลือกช่าง (ไม่บังคับ) —</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.role ? ` (${t.role})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* จำนวน */}
        <div className="mb-5">
          <label htmlFor="quantity-input" className="block text-sm font-medium text-slate-300 mb-2">
            จำนวน <span className="text-red-400">*</span>
          </label>
          <input
            id="quantity-input"
            type="number"
            min="1"
            className="form-input"
            placeholder="ระบุจำนวน"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        {/* ชื่อหน้างาน */}
        <div className="mb-5">
          <label htmlFor="job-name-input" className="block text-sm font-medium text-slate-300 mb-2">
            ชื่อหน้างาน / โปรเจกต์
          </label>
          <input
            id="job-name-input"
            type="text"
            className="form-input"
            placeholder="เช่น โปรเจกต์ บ้านคุณสมชาย"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
          />
        </div>

        {/* หมายเหตุ */}
        <div className="mb-5">
          <label htmlFor="note-input" className="block text-sm font-medium text-slate-300 mb-2">
            หมายเหตุ
          </label>
          <input
            id="note-input"
            type="text"
            className="form-input"
            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* วันที่ */}
        <div className="mb-8">
          <label htmlFor="date-input" className="block text-sm font-medium text-slate-300 mb-2">
            วันที่บันทึก
          </label>
          <input
            id="date-input"
            type="date"
            className="form-input"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full text-base"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลังบันทึก...
            </>
          ) : (
            <>💾 บันทึกรายการ</>
          )}
        </button>
      </form>

      {/* Recent Transactions */}
      {recentTxns.length > 0 && (
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold text-white mb-4">🕐 รายการที่เพิ่งบันทึก</h3>
          <div className="space-y-3">
            {recentTxns.map((txn, idx) => (
              <div
                key={txn.id || idx}
                className="glass-card glass-card-hover p-4 flex items-center justify-between animate-fade-in"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                      txn.type === 'IN'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {txn.type === 'IN' ? '📥' : '📤'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{txn.product_name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {txn.job_name || '—'}{txn.technician_name ? ` · 👷 ${txn.technician_name}` : ''} · {txn.transaction_date}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    txn.type === 'IN' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {txn.type === 'IN' ? '+' : '-'}{txn.quantity} {txn.product_unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

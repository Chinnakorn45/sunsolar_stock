/**
 * StockList.jsx — หน้ารายการอุปกรณ์ในสต๊อก
 *
 * แสดงสต๊อกอุปกรณ์ทั้งหมดในรูปแบบ Card Grid พร้อม:
 *  - รูปภาพอุปกรณ์
 *  - จำนวนคงเหลือ + progress bar
 *  - Badge สถานะ (ปกติ / ต่ำ / หมด)
 *  - ค้นหา / กรองสถานะ / เรียงลำดับ
 *  - Refresh แบบ real-time
 */
import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../utils/api';

/* ───────────────── Constants ───────────────── */
const SORT_OPTIONS = [
  { value: 'name_asc',     label: 'ชื่อ A→Z' },
  { value: 'name_desc',    label: 'ชื่อ Z→A' },
  { value: 'stock_asc',   label: 'คงเหลือ น้อย→มาก' },
  { value: 'stock_desc',  label: 'คงเหลือ มาก→น้อย' },
  { value: 'status',       label: 'สถานะ (ต่ำก่อน)' },
];

/* ─────────────── Status helpers ─────────────── */
function getStatus(net_balance, reorder_point) {
  if (net_balance <= 0)                              return 'empty';
  if (reorder_point > 0 && net_balance <= reorder_point) return 'low';
  return 'ok';
}

const STATUS_CONFIG = {
  ok:    { label: 'ปกติ',    bg: 'bg-emerald-500/15', text: 'text-emerald-600', border: 'border-emerald-500/25', dot: 'bg-emerald-500', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
  low:   { label: 'สต๊อกต่ำ', bg: 'bg-amber-500/15',  text: 'text-amber-600',  border: 'border-amber-500/25',  dot: 'bg-amber-500',  bar: 'bg-gradient-to-r from-amber-400 to-orange-400' },
  empty: { label: 'หมด',     bg: 'bg-red-500/15',    text: 'text-red-600',    border: 'border-red-500/25',    dot: 'bg-red-500',    bar: 'bg-gradient-to-r from-red-400 to-red-500' },
};

/* ─────────────── Main Component ─────────────── */
export default function StockList() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');   // all | ok | low | empty
  const [sort, setSort]       = useState('name_asc');
  const [view, setView]       = useState('grid');   // grid | list

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/reports/inventory-overview`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('StockList fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ── derived data ── */
  const processed = useMemo(() => {
    return data.map(row => ({
      ...row,
      status: getStatus(row.net_balance, row.reorder_point),
    }));
  }, [data]);

  const filtered = useMemo(() => {
    let result = processed;

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(r => r.product_name.toLowerCase().includes(q));
    }

    // Filter by status
    if (filter !== 'all') {
      result = result.filter(r => r.status === filter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name_asc':   return a.product_name.localeCompare(b.product_name, 'th');
        case 'name_desc':  return b.product_name.localeCompare(a.product_name, 'th');
        case 'stock_asc':  return a.net_balance - b.net_balance;
        case 'stock_desc': return b.net_balance - a.net_balance;
        case 'status': {
          const order = { empty: 0, low: 1, ok: 2 };
          return order[a.status] - order[b.status];
        }
        default: return 0;
      }
    });

    return result;
  }, [processed, search, filter, sort]);

  /* ── summary counts ── */
  const counts = useMemo(() => ({
    total: processed.length,
    ok:    processed.filter(r => r.status === 'ok').length,
    low:   processed.filter(r => r.status === 'low').length,
    empty: processed.filter(r => r.status === 'empty').length,
    totalStock: processed.reduce((s, r) => s + Math.max(r.net_balance, 0), 0),
  }), [processed]);

  /* ── progress bar width ── */
  function barWidth(row) {
    if (row.total_in === 0) return 0;
    const pct = (row.net_balance / row.total_in) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">

      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">🗂️ รายการอุปกรณ์ในสต๊อก</h2>
          <p className="text-slate-500 text-sm">
            อุปกรณ์ทั้งหมด {counts.total} รายการ
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                · อัปเดตล่าสุด {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-primary whitespace-nowrap self-start sm:self-auto"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              กำลังโหลด...
            </span>
          ) : '🔄 รีเฟรช'}
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
        <SummaryCard
          label="รายการทั้งหมด" value={counts.total} icon="📋"
          accent="text-blue-600" bg="bg-blue-50 border-blue-200/60"
          onClick={() => setFilter('all')} active={filter === 'all'}
        />
        <SummaryCard
          label="ปกติ" value={counts.ok} icon="✅"
          accent="text-emerald-600" bg="bg-emerald-50 border-emerald-200/60"
          onClick={() => setFilter(f => f === 'ok' ? 'all' : 'ok')} active={filter === 'ok'}
        />
        <SummaryCard
          label="สต๊อกต่ำ" value={counts.low} icon="⚠️"
          accent="text-amber-600" bg="bg-amber-50 border-amber-200/60"
          onClick={() => setFilter(f => f === 'low' ? 'all' : 'low')} active={filter === 'low'}
          alert={counts.low > 0}
        />
        <SummaryCard
          label="หมดสต๊อก" value={counts.empty} icon="🚨"
          accent="text-red-600" bg="bg-red-50 border-red-200/60"
          onClick={() => setFilter(f => f === 'empty' ? 'all' : 'empty')} active={filter === 'empty'}
          alert={counts.empty > 0}
        />
      </div>

      {/* ── Controls ── */}
      <div className="glass-card p-4 mb-5 flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.14s' }}>
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            className="form-input !pl-9 !py-2.5"
            placeholder="ค้นหาชื่ออุปกรณ์..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs"
            >✕</button>
          )}
        </div>

        {/* Sort */}
        <select
          className="form-select !py-2.5 sm:w-52"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-2.5 text-sm font-medium transition-all ${view === 'grid' ? 'bg-solar-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            title="Grid View"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2.5 text-sm font-medium transition-all ${view === 'list' ? 'bg-solar-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            title="List View"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Result count ── */}
      {!loading && (search || filter !== 'all') && (
        <p className="text-sm text-slate-500 mb-4 animate-fade-in">
          แสดง <span className="font-semibold text-slate-700">{filtered.length}</span> รายการ
          {filter !== 'all' && <span> · กรอง: <span className="text-solar-500 font-medium">{STATUS_CONFIG[filter]?.label}</span></span>}
          {search && <span> · ค้นหา: "<span className="text-solar-500 font-medium">{search}</span>"</span>}
          <button onClick={() => { setSearch(''); setFilter('all'); }} className="ml-3 text-xs text-slate-400 hover:text-slate-600 underline">ล้างตัวกรอง</button>
        </p>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="glass-card p-16 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-solar-50 border border-solar-200/60 mb-4">
            <div className="w-8 h-8 border-3 border-solar-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          </div>
          <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลสต๊อก...</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card p-16 text-center animate-fade-in">
          <p className="text-5xl mb-4">📭</p>
          <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่พบรายการ</h3>
          <p className="text-slate-500 text-sm">
            {search || filter !== 'all' ? 'ลองเปลี่ยนเงื่อนไขการค้นหา' : 'ยังไม่มีอุปกรณ์ในระบบ'}
          </p>
        </div>
      )}

      {/* ── Grid View ── */}
      {!loading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {filtered.map((row, idx) => (
            <StockCard key={row.product_id} row={row} idx={idx} barWidth={barWidth(row)} />
          ))}
        </div>
      )}

      {/* ── List View ── */}
      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="summary-table w-full">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>อุปกรณ์</th>
                  <th>หน่วย</th>
                  <th className="text-right">เข้าทั้งหมด</th>
                  <th className="text-right">ออกทั้งหมด</th>
                  <th className="text-right">คงเหลือ</th>
                  <th className="text-center">สถานะ</th>
                  <th className="w-40">คงเหลือ (%)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => {
                  const cfg = STATUS_CONFIG[row.status];
                  const pct = barWidth(row);
                  return (
                    <tr key={row.product_id} className={row.status !== 'ok' ? 'low-stock' : ''}>
                      <td className="text-slate-400 text-xs">{idx + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                            {row.image_url
                              ? <img src={row.image_url} alt={row.product_name} className="w-full h-full object-cover" />
                              : <span className="text-base opacity-40">📦</span>}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{row.product_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-500 text-sm">{row.unit}</td>
                      <td className="text-right">
                        <span className="text-emerald-600 font-medium tabular-nums">+{row.total_in.toLocaleString()}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-red-500 font-medium tabular-nums">-{row.total_out.toLocaleString()}</span>
                      </td>
                      <td className="text-right">
                        <span className={`text-xl font-bold tabular-nums ${row.status === 'ok' ? 'text-slate-800' : row.status === 'low' ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.max(row.net_balance, 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="w-40 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 tabular-nums w-9 text-right">{Math.round(pct)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {!loading && filtered.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 animate-fade-in">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
              {cfg.label}
              {key === 'low' && <span className="text-slate-400">(≤ จุดสั่งซื้อซ้ำ)</span>}
            </span>
          ))}
          <span className="text-slate-400">· % = เปอร์เซ็นต์จากยอดรับเข้าทั้งหมด</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

function SummaryCard({ label, value, icon, accent, bg, onClick, active, alert }) {
  return (
    <button
      onClick={onClick}
      className={`glass-card p-4 sm:p-5 text-left transition-all duration-200 hover:scale-[1.02] ${active ? 'ring-2 ring-solar-400 ring-offset-1' : ''} ${alert && value > 0 ? 'border-red-300/60' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${accent}`}>
        {value.toLocaleString()}
      </p>
      {active && (
        <span className="text-[10px] text-solar-500 font-semibold mt-1 inline-block">กำลังกรอง ✓</span>
      )}
    </button>
  );
}

function StockCard({ row, idx, barWidth }) {
  const cfg = STATUS_CONFIG[row.status];

  return (
    <div
      className="glass-card glass-card-hover overflow-hidden flex flex-col animate-fade-in-up"
      style={{ animationDelay: `${Math.min(idx * 0.04, 0.5)}s` }}
    >
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {row.image_url ? (
          <img
            src={row.image_url}
            alt={row.product_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className={`absolute inset-0 ${row.image_url ? 'hidden' : 'flex'} items-center justify-center`}>
          <span className="text-6xl opacity-20">📦</span>
        </div>

        {/* Status badge overlay */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${cfg.bg} ${cfg.text} border ${cfg.border} shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${row.status !== 'ok' ? 'animate-pulse' : ''}`}/>
            {cfg.label}
          </span>
        </div>

        {/* Stock number overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className={`text-2xl font-black tabular-nums ${row.status === 'ok' ? 'text-white' : row.status === 'low' ? 'text-amber-300' : 'text-red-300'}`}>
            {Math.max(row.net_balance, 0).toLocaleString()}
            <span className="text-sm font-normal ml-1.5 opacity-80">{row.unit}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{row.product_name}</h3>
          {row.reorder_point > 0 && (
            <p className="text-[11px] text-slate-400 mt-0.5">จุดสั่งซื้อซ้ำ: <span className="text-solar-500 font-semibold">{row.reorder_point.toLocaleString()} {row.unit}</span></p>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span>คงเหลือ</span>
            <span className="font-medium">{Math.round(barWidth)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* In/Out stats */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <div className="text-center">
            <p className="text-[10px] text-emerald-600/70 font-medium mb-0.5">📥 รับเข้า</p>
            <p className="text-sm font-bold text-emerald-600 tabular-nums">+{row.total_in.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-red-500/70 font-medium mb-0.5">📤 จ่ายออก</p>
            <p className="text-sm font-bold text-red-500 tabular-nums">-{row.total_out.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

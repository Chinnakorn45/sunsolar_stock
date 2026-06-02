/**
 * InventoryOverview.jsx — หน้าสรุปสต๊อกทั้งหมด
 * แสดงสถานะอุปกรณ์แบบภาพรวม (All-time)
 */
import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import { LowStockBadge, NumberDisplay } from '../components/StatusBadge';

export default function InventoryOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/inventory-overview`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load inventory overview:', err);
    } finally {
      setLoading(false);
    }
  }

  // คำนวณ Totals
  const totals = data.reduce(
    (acc, row) => ({
      totalIn: acc.totalIn + row.total_in,
      totalOut: acc.totalOut + row.total_out,
    }),
    { totalIn: 0, totalOut: 0 }
  );

  const lowStockCount = data.filter(
    (row) => row.reorder_point > 0 && row.net_balance <= row.reorder_point
  ).length;

  function getImageSrc(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    const base = API_BASE.replace(/\/api$/, '');
    return `${base}${imageUrl}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8 animate-fade-in-up">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">📦 สรุปสต๊อกทั้งหมด (ภาพรวม)</h2>
        <p className="text-slate-500 text-sm">สถานะคงเหลือของอุปกรณ์ทั้งหมดในระบบ</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <StatCard label="จำนวนรายการ" value={data.length} icon="📋" color="text-solar-400" />
        <StatCard label="รวมรับเข้าทั้งหมด" value={totals.totalIn} icon="📥" color="text-emerald-400" />
        <StatCard label="รวมจ่ายออกทั้งหมด" value={totals.totalOut} icon="📤" color="text-red-400" />
        <StatCard label="สต๊อกต่ำ" value={lowStockCount} icon="⚠️" color={lowStockCount > 0 ? 'text-red-400' : 'text-emerald-400'} alert={lowStockCount > 0} />
      </div>

      <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-solar-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">ยังไม่มีข้อมูลอุปกรณ์ในระบบ</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="summary-table w-full">
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>รายการ</th>
                    <th>หน่วย</th>
                    <th className="text-right">เข้าทั้งหมด</th>
                    <th className="text-right">ออกทั้งหมด</th>
                    <th className="text-right text-solar-400 font-bold">คงเหลือสุทธิ</th>
                    <th className="text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => {
                    const isLow = row.reorder_point > 0 && row.net_balance <= row.reorder_point;
                    return (
                      <tr key={row.product_id} className={isLow ? 'low-stock' : ''}>
                        <td className="text-slate-500 text-xs">{idx + 1}</td>
                        <td className="font-medium text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                              {row.image_url ? (
                                <img src={getImageSrc(row.image_url)} alt={row.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm opacity-50">📦</span>
                              )}
                            </div>
                            {row.product_name}
                          </div>
                        </td>
                        <td className="text-slate-400 text-sm">{row.unit}</td>
                        <td className="text-right">
                          <NumberDisplay value={row.total_in} type="in" />
                        </td>
                        <td className="text-right">
                          <NumberDisplay value={row.total_out} type="out" />
                        </td>
                        <td className="text-right">
                          <span className={`font-bold tabular-nums text-lg ${isLow ? 'text-red-600' : 'text-solar-600'}`}>
                            {row.net_balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-center">
                          {isLow ? <LowStockBadge /> : <span className="text-xs text-emerald-600 font-semibold">✓ ปกติ</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-700/30">
              {data.map((row) => {
                const isLow = row.reorder_point > 0 && row.net_balance <= row.reorder_point;
                return (
                  <div key={row.product_id} className={`mobile-card ${isLow ? 'bg-red-500/5' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                          {row.image_url ? (
                            <img src={getImageSrc(row.image_url)} alt={row.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base opacity-50">📦</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-slate-800 text-sm truncate pr-2">{row.product_name}</h4>
                          <span className="text-xs text-slate-500">{row.unit}</span>
                        </div>
                      </div>
                      {isLow && <LowStockBadge />}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-500/5 rounded-lg p-2">
                        <p className="text-[10px] text-emerald-600/70 mb-0.5">เข้า (รวม)</p>
                        <p className="text-sm font-semibold text-emerald-600 tabular-nums">+{row.total_in.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-500/5 rounded-lg p-2">
                        <p className="text-[10px] text-red-500/70 mb-0.5">ออก (รวม)</p>
                        <p className="text-sm font-semibold text-red-600 tabular-nums">-{row.total_out.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-lg p-2 ${isLow ? 'bg-red-500/10' : 'bg-solar-500/10'}`}>
                        <p className="text-[10px] text-solar-600 mb-0.5">คงเหลือ</p>
                        <p className={`text-sm font-bold tabular-nums ${isLow ? 'text-red-600' : 'text-solar-600'}`}>
                          {row.net_balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {!loading && lowStockCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50" />
          <span>แถวที่เน้นสี = คงเหลือต่ำกว่าหรือเท่ากับจุดสั่งซื้อซ้ำ (Reorder Point)</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, alert }) {
  return (
    <div className={`glass-card p-4 sm:p-5 ${alert ? 'border-red-500/30' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${color}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

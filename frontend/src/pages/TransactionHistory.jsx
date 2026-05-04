/**
 * TransactionHistory.jsx — หน้าประวัติรายการทั้งหมด
 * แสดงรายการ IN/OUT ทั้งหมดที่เคยบันทึก
 */
import { useState, useEffect } from 'react';

export default function TransactionHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterMode, setFilterMode] = useState('all'); // all, daily, monthly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchHistory();
  }, [filterMode, selectedDate, selectedMonth]);

  async function fetchHistory() {
    setLoading(true);
    try {
      let url = '/api/transactions/history';
      if (filterMode === 'daily') {
        url += `?startDate=${selectedDate}&endDate=${selectedDate}`;
      } else if (filterMode === 'monthly') {
        const [year, month] = selectedMonth.split('-');
        // เดือนใน JS เริ่มที่ 0 (0-11)
        const firstDay = new Date(year, parseInt(month) - 1, 2).toISOString().split('T')[0]; // +2 hours/days offset workaround or just use local
        // วิธีที่ปลอดภัยกับ Timezone:
        const firstDate = `${year}-${month}-01`;
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const lastDate = `${year}-${month}-${lastDay}`;
        url += `?startDate=${firstDate}&endDate=${lastDate}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatThaiDateWithTime(dateStr, createdAt) {
    const d = new Date(createdAt);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">📜 ประวัติรายการทั้งหมด</h2>
          <p className="text-slate-400 text-sm">ประวัติการนำเข้าและเบิกจ่ายอุปกรณ์</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="form-select !w-auto text-sm"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            <option value="all">ทั้งหมด (All-time)</option>
            <option value="daily">รายวัน (Daily)</option>
            <option value="monthly">รายเดือน (Monthly)</option>
          </select>

          {filterMode === 'daily' && (
            <input
              type="date"
              className="form-input !w-auto text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          {filterMode === 'monthly' && (
            <input
              type="month"
              className="form-input !w-auto text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-solar-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">ยังไม่มีประวัติการทำรายการ</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="summary-table w-full">
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>วัน-เวลา</th>
                    <th>ประเภท</th>
                    <th>รายการ</th>
                    <th className="text-right">จำนวน</th>
                    <th>ช่างผู้รับ</th>
                    <th>หน้างาน</th>
                    <th>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="text-slate-500 text-xs">{idx + 1}</td>
                      <td className="text-slate-300 text-sm">{formatThaiDateWithTime(row.transaction_date, row.created_at)}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {row.type === 'IN' ? '📥 นำเข้า' : '📤 จ่ายออก'}
                        </span>
                      </td>
                      <td className="font-medium text-white">{row.product_name}</td>
                      <td className={`text-right font-bold tabular-nums ${row.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.type === 'IN' ? '+' : '-'}{row.quantity} <span className="text-xs font-normal text-slate-400">{row.unit}</span>
                      </td>
                      <td className="text-slate-400 text-sm">{row.technician_name || '-'}</td>
                      <td className="text-slate-400 text-sm">{row.job_name || '-'}</td>
                      <td className="text-slate-400 text-sm">{row.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-slate-700/30">
              {data.map((row) => (
                <div key={row.id} className="p-4 bg-surface-800/20">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {row.type === 'IN' ? 'IN' : 'OUT'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatThaiDateWithTime(row.transaction_date, row.created_at)}
                        </span>
                      </div>
                      <h4 className="font-medium text-white text-sm">
                        {row.product_name}
                      </h4>
                    </div>
                    <div className={`text-right font-bold tabular-nums text-lg ${row.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.type === 'IN' ? '+' : '-'}{row.quantity}
                      <span className="block text-[10px] font-normal text-slate-500">{row.unit}</span>
                    </div>
                  </div>
                  {(row.technician_name || row.job_name || row.note) && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 bg-surface-700/30 p-2 rounded">
                      {row.technician_name && (
                        <div className="col-span-2 sm:col-span-1">👷 ช่าง: {row.technician_name}</div>
                      )}
                      {row.job_name && (
                        <div className="col-span-2 sm:col-span-1">📍 งาน: {row.job_name}</div>
                      )}
                      {row.note && (
                        <div className="col-span-2 text-slate-500 italic">📝 {row.note}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

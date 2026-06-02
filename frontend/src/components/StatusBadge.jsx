/**
 * StatusBadge.jsx — Reusable Badge Component
 * แสดงสถานะ IN/OUT และ stock level
 */

/**
 * Badge สำหรับแสดงประเภทธุรกรรม (IN/OUT)
 */
export function TypeBadge({ type }) {
  const isIn = type === 'IN';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
        isIn
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm'
          : 'bg-red-50 text-red-700 border border-red-200/80 shadow-sm'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isIn ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
      {isIn ? 'นำเข้า' : 'จ่ายออก'}
    </span>
  );
}

/**
 * Badge แจ้งเตือนสต๊อกต่ำ
 */
export function LowStockBadge() {
  return (
    <span className="low-stock-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/80 shadow-sm">
      ⚠️ สต๊อกต่ำ
    </span>
  );
}

/**
 * แสดงตัวเลขพร้อมสี (เขียว=เข้า, แดง=ออก)
 */
export function NumberDisplay({ value, type }) {
  if (value === 0) return <span className="text-slate-500">—</span>;

  const colorClass = type === 'in' ? 'text-emerald-600' : type === 'out' ? 'text-red-600' : 'text-slate-800';
  const prefix = type === 'in' ? '+' : type === 'out' ? '-' : '';

  return (
    <span className={`font-semibold tabular-nums ${colorClass}`}>
      {prefix}{value.toLocaleString()}
    </span>
  );
}

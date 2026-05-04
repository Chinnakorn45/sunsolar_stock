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
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
          : 'bg-red-500/15 text-red-400 border border-red-500/20'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isIn ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
      {isIn ? 'นำเข้า' : 'จ่ายออก'}
    </span>
  );
}

/**
 * Badge แจ้งเตือนสต๊อกต่ำ
 */
export function LowStockBadge() {
  return (
    <span className="low-stock-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
      ⚠️ สต๊อกต่ำ
    </span>
  );
}

/**
 * แสดงตัวเลขพร้อมสี (เขียว=เข้า, แดง=ออก)
 */
export function NumberDisplay({ value, type }) {
  if (value === 0) return <span className="text-slate-500">—</span>;

  const colorClass = type === 'in' ? 'text-emerald-400' : type === 'out' ? 'text-red-400' : 'text-white';
  const prefix = type === 'in' ? '+' : type === 'out' ? '-' : '';

  return (
    <span className={`font-semibold tabular-nums ${colorClass}`}>
      {prefix}{value.toLocaleString()}
    </span>
  );
}

/* India-friendly formatting helpers (₹, DD/MM/YYYY, 12h time). */

/** ₹1,23,456 — Indian digit grouping. */
export function formatRupees(amount: number, withPaise = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: withPaise ? 2 : 0,
  }).format(amount);
}

/** "2026-06-01" | ISO -> "01/06/2026". Returns input unchanged if unparseable. */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const datePart = value.includes('T') ? value.split('T')[0] : value;
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** "13:05" or ISO -> "1:05 PM". */
export function formatTime(value?: string | null): string {
  if (!value) return '';
  const t = value.includes('T') ? (value.split('T')[1]?.slice(0, 5) ?? '') : value.slice(0, 5);
  const [hStr, min] = t.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return value;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min ?? '00'} ${period}`;
}

/** ISO datetime -> "01/06/2026 · 9:05 AM". */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return `${formatDate(value)} · ${formatTime(value)}`;
}

import { STATUS_LABELS } from '../lib/constants';

const TONES = {
  PLACED: 'bg-navy-100 text-navy-700',
  CONFIRMED: 'bg-lavender-100 text-lavender-800',
  PACKED: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-sky-100 text-sky-700',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-800',
};

/** Pill badge for order status / payment status. */
export default function StatusBadge({ status, className = '' }) {
  const label = STATUS_LABELS[status] || status || 'Unknown';
  const tone = TONES[status] || 'bg-navy-100 text-navy-700';
  return (
    <span className={`chip ${tone} ${className}`}>{label}</span>
  );
}

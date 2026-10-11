// Formatting helpers shared across JayaMart pages.
import { DELIVERY_CHARGE, FREE_DELIVERY_MIN } from './constants';

export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value, withTime = true) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  });
}

export function stockLabel(stock) {
  if (stock <= 0) return { text: 'Out of Stock', tone: 'rose' };
  if (stock < 10) return { text: `Only ${stock} left`, tone: 'amber' };
  return { text: 'In Stock', tone: 'emerald' };
}

/**
 * Mirror of the backend pricing rules so checkout can preview totals.
 * items: [{ price, originalPrice, quantity }]
 */
export function computeTotals(items) {
  let gross = 0;
  let itemsTotal = 0;
  items.forEach((item) => {
    gross += Number(item.originalPrice) * item.quantity;
    itemsTotal += Number(item.price) * item.quantity;
  });
  const discount = Math.round((gross - itemsTotal) * 100) / 100;
  const delivery = items.length === 0 || itemsTotal === 0
    ? 0
    : itemsTotal >= FREE_DELIVERY_MIN
      ? 0
      : DELIVERY_CHARGE;
  const total = Math.round((itemsTotal + delivery) * 100) / 100;
  return { gross, discount, itemsTotal, delivery, total };
}

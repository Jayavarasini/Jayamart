// Shared UI constants for JayaMart: categories, order statuses, pricing rules.

export const CATEGORIES = [
  'All',
  'Grocery',
  'Fragrance',
  'Juice',
  'Ice Cream',
  'Snacks',
  'Stationery',
  'Makeup',
];

// Emoji + gradient used for category cards and image fallbacks.
export const CATEGORY_META = {
  Grocery: { emoji: '🛒', gradient: 'from-emerald-400 to-teal-500' },
  Fragrance: { emoji: '🌸', gradient: 'from-lavender-400 to-lavender-600' },
  Juice: { emoji: '🧃', gradient: 'from-amber-400 to-orange-500' },
  'Ice Cream': { emoji: '🍨', gradient: 'from-sky-400 to-indigo-400' },
  Snacks: { emoji: '🍪', gradient: 'from-amber-500 to-rose-400' },
  Stationery: { emoji: '✏️', gradient: 'from-navy-400 to-navy-600' },
  Makeup: { emoji: '💄', gradient: 'from-rose-400 to-pink-500' },
};

export const ORDER_STATUS_FLOW = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const STATUS_LABELS = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

export const DELIVERY_CHARGE = 49;
export const FREE_DELIVERY_MIN = 499;

export const DEMO_BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'];

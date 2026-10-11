// Shared constants for the JayaMart backend

const CATEGORIES = [
  'Grocery',
  'Fragrance',
  'Juice',
  'Ice Cream',
  'Snacks',
  'Stationery',
  'Makeup',
];

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const PAYMENT_METHODS = ['NET_BANKING'];

const DEMO_BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'];

const LOW_STOCK_THRESHOLD = 10;

const DELIVERY_CHARGE = 49;
const FREE_DELIVERY_MIN = 499;

module.exports = {
  CATEGORIES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  DEMO_BANKS,
  LOW_STOCK_THRESHOLD,
  DELIVERY_CHARGE,
  FREE_DELIVERY_MIN,
};

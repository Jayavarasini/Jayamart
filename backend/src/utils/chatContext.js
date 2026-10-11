// Builds the JayaMart context used by the shopping assistant.
// Every value comes straight from the database / config - nothing is invented.
const { query } = require('../config/db');
const {
  CATEGORIES,
  ORDER_STATUSES,
  DELIVERY_CHARGE,
  FREE_DELIVERY_MIN,
  LOW_STOCK_THRESHOLD,
  DEMO_BANKS,
} = require('../config/constants');

// Tiny in-memory cache so a busy chat does not hammer MySQL.
let cache = { at: 0, data: null };
const CACHE_TTL_MS = 30 * 1000;

function round2(value) {
  return Math.round(value * 100) / 100;
}

/** Compact catalog (products + categories + offers). Cached for 30 seconds. */
async function getCatalogContext() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const rows = await query(
    `SELECT id, name, category, description, price, original_price, discount_percentage, stock, image
     FROM products ORDER BY id ASC`
  );

  const products = rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    category: row.category,
    description: String(row.description || ''),
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    discountPercentage: Number(row.discount_percentage),
    stock: Number(row.stock),
    image: row.image || null,
  }));

  const categories = CATEGORIES.map((name) => ({
    name,
    productCount: products.filter((p) => p.category === name).length,
  }));

  const offers = products
    .filter((p) => p.discountPercentage > 0)
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discountPercentage: p.discountPercentage,
    }));

  cache = { at: Date.now(), data: { products, categories, offers } };
  return cache.data;
}

/** Store policies that genuinely exist in the app (from config constants). */
function getStoreRules() {
  return {
    categories: CATEGORIES,
    deliveryCharge: DELIVERY_CHARGE,
    freeDeliveryMin: FREE_DELIVERY_MIN,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    orderStatuses: ORDER_STATUSES,
    paymentMethod: `Net Banking only (demo) - supported banks: ${DEMO_BANKS.join(', ')}`,
    supportEmail: 'support@jayamart.com',
    faq: [
      `Delivery costs Rs. ${DELIVERY_CHARGE} and is FREE for orders of Rs. ${FREE_DELIVERY_MIN} or more.`,
      'Payment is a Net Banking demo (no real money moves); completing payment generates a transaction id like JM123456XYZ.',
      `Order statuses move through: ${ORDER_STATUSES.join(' -> ')}.`,
      'Signed-in buyers can see their orders under /orders and live tracking under /order/:id.',
      'Anyone can register; SELLER accounts additionally manage products and update order status from /seller.',
      'Returns, refunds and cancellation policies are not defined in this academic demo - direct such questions to support@jayamart.com.',
    ],
  };
}

/**
 * Cart + recent orders for the signed-in user (or null for guests).
 * Deliberately excludes email / phone / address - the AI never sees them.
 */
async function getUserContext(userId) {
  if (!userId) return null;
  try {
    const cartRows = await query(
      `SELECT c.quantity, c.saved_for_later, p.id AS product_id, p.name, p.category, p.price, p.stock, p.image
       FROM cart c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.id ASC`,
      [userId]
    );

    const active = cartRows.filter((row) => !Number(row.saved_for_later));
    const items = active.map((row) => ({
      productId: Number(row.product_id),
      name: row.name,
      quantity: Number(row.quantity),
      price: Number(row.price),
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge =
      subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_CHARGE;

    const orderRows = await query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.id DESC
       LIMIT 5`,
      [userId]
    );

    return {
      signedIn: true,
      cart: {
        items,
        savedForLaterCount: cartRows.length - active.length,
        subtotal: round2(subtotal),
        deliveryCharge,
        total: round2(subtotal + deliveryCharge),
      },
      recentOrders: orderRows.map((row) => ({
        orderId: Number(row.id),
        status: row.status,
        total: Number(row.total_amount),
        placedOn: String(row.created_at).slice(0, 10),
        itemCount: Number(row.item_count),
      })),
    };
  } catch (error) {
    console.warn('[chat] could not build user context:', error.message);
    return { signedIn: true, cart: null, recentOrders: [] };
  }
}

module.exports = { getCatalogContext, getStoreRules, getUserContext };

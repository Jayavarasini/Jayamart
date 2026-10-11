// Seller APIs: dashboard summary, low stock alerts and order list.
const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireSeller } = require('../middleware/auth');
const { serializeProduct } = require('../utils/serializer');
const { LOW_STOCK_THRESHOLD } = require('../config/constants');

const router = express.Router();

router.use(authenticate, requireSeller);

// GET /api/seller/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [productCount] = await query('SELECT COUNT(*) AS count FROM products');
    const [lowStockCount] = await query(
      'SELECT COUNT(*) AS count FROM products WHERE stock < ?',
      [LOW_STOCK_THRESHOLD]
    );
    const [outOfStockCount] = await query('SELECT COUNT(*) AS count FROM products WHERE stock = 0');
    const [orderCount] = await query('SELECT COUNT(*) AS count FROM orders');
    const [salesRow] = await query(
      'SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders'
    );
    const [revenueRow] = await query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'SUCCESS'"
    );

    const lowStock = await query(
      `SELECT * FROM products WHERE stock < ? ORDER BY stock ASC, name ASC`,
      [LOW_STOCK_THRESHOLD]
    );

    const recentOrders = await query(
      `SELECT o.id, o.total_amount, o.status, o.customer_name, o.created_at,
              (SELECT p.status FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_status
       FROM orders o
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT 5`
    );

    res.json({
      totalProducts: Number(productCount.count),
      lowStockCount: Number(lowStockCount.count),
      outOfStockCount: Number(outOfStockCount.count),
      totalOrders: Number(orderCount.count),
      totalSales: Number(salesRow.total),
      paidRevenue: Number(revenueRow.total),
      lowStock: lowStock.map(serializeProduct),
      recentOrders: recentOrders.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        totalAmount: Number(row.total_amount),
        status: row.status,
        paymentStatus: row.payment_status || 'PENDING',
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/seller/low-stock - products with stock below the threshold
router.get('/low-stock', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT * FROM products WHERE stock < ? ORDER BY stock ASC, name ASC`,
      [LOW_STOCK_THRESHOLD]
    );
    res.json({
      threshold: LOW_STOCK_THRESHOLD,
      products: rows.map(serializeProduct),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/seller/orders - every order (for seller order management)
router.get('/orders', async (req, res, next) => {
  try {
    const orderRows = await query(
      'SELECT id FROM orders ORDER BY created_at DESC, id DESC'
    );

    const orders = [];
    for (const row of orderRows) {
      const order = await query('SELECT * FROM orders WHERE id = ?', [row.id]);
      const items = await query(
        `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price,
                p.image, p.category
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?
         ORDER BY oi.id`,
        [row.id]
      );
      const payment = await query(
        'SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1',
        [row.id]
      );
      const o = order[0];
      const p = payment[0] || null;
      orders.push({
        id: o.id,
        userId: o.user_id,
        totalAmount: Number(o.total_amount),
        status: o.status,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        city: o.city,
        pincode: o.pincode,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        paymentStatus: p ? p.status : 'PENDING',
        paymentMethod: p ? p.payment_method : null,
        bank: p ? p.bank : null,
        transactionId: p ? p.transaction_id : null,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        items: items.map((item) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: Number(item.price),
          image: item.image || null,
          category: item.category || null,
        })),
      });
    }

    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

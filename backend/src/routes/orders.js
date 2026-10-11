// Orders + order tracking APIs.
// POST /api/orders, GET /api/orders, GET /api/orders/:id,
// GET /api/orders/:id/track, PUT /api/orders/:id/status
const express = require('express');
const { query, getOne, withTransaction } = require('../config/db');
const { authenticate, requireSeller } = require('../middleware/auth');
const {
  ORDER_STATUSES,
  DELIVERY_CHARGE,
  FREE_DELIVERY_MIN,
} = require('../config/constants');

const router = express.Router();

router.use(authenticate);

const STATUS_LABELS = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

/** Small helper to throw HTTP-aware errors from inside transactions. */
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/** Payments are stored as SUCCESS/FAILED; expose them as PAID/PENDING/FAILED. */
function serializePaymentStatus(status) {
  if (status === 'SUCCESS') return 'PAID';
  if (!status) return 'PENDING';
  return status;
}

function serializeOrder(order, items = [], payment = null) {
  return {
    id: order.id,
    userId: order.user_id,
    totalAmount: Number(order.total_amount),
    status: order.status,
    statusHistory: safeParse(order.status_history),
    customerName: order.customer_name,
    phone: order.phone,
    address: order.address,
    city: order.city,
    pincode: order.pincode,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    paymentStatus: payment ? serializePaymentStatus(payment.status) : 'PENDING',
    paymentMethod: payment ? payment.payment_method : null,
    bank: payment ? payment.bank : null,
    transactionId: payment ? payment.transaction_id : null,
    paidAt: payment ? payment.created_at : null,
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
  };
}

function safeParse(value) {
  // mysql2 already parses JSON columns - keep arrays as-is.
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Load an order with its items and payment (used by all single-order routes). */
async function loadOrder(orderId) {
  const order = await getOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) return null;

  const items = await query(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.price,
            p.image, p.category
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId]
  );

  const payment = await getOne(
    'SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1',
    [orderId]
  );

  return serializeOrder(order, items, payment);
}

function ownsOrder(order, user) {
  return order.userId === user.id || user.role === 'SELLER';
}

/** Delivery charge rules - mirrored by the frontend for the checkout preview. */
function computeDeliveryCharge(itemsTotal) {
  if (itemsTotal <= 0) return 0;
  return itemsTotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_CHARGE;
}

// GET /api/orders - the logged in user's orders
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC',
      [req.user.id]
    );
    const orders = [];
    for (const row of rows) {
      orders.push(await loadOrder(row.id));
    }
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders
// Body: customer details + optional `items` (Buy Now flow).
// Without `items` the order is built from the user's active cart.
router.post('/', async (req, res, next) => {
  try {
    const {
      customerName,
      phone,
      address,
      city,
      pincode,
      items: requestedItems,
    } = req.body || {};

    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
      return res.status(400).json({ message: 'A valid 10-digit phone number is required' });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ message: 'Address is required' });
    }
    if (!city || !String(city).trim()) {
      return res.status(400).json({ message: 'City is required' });
    }
    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ message: 'A valid 6-digit pincode is required' });
    }

    const buyNow = Array.isArray(requestedItems) && requestedItems.length > 0;

    const orderId = await withTransaction(async (connection) => {
      // ---- 1. Resolve the order lines (Buy Now or cart) ----
      let lines = [];

      if (buyNow) {
        for (const item of requestedItems) {
          const productId = Number(item.productId);
          const quantity = Number(item.quantity);
          if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
            throw httpError(400, 'Invalid product or quantity in the order');
          }
          const [rows] = await connection.query(
            'SELECT * FROM products WHERE id = ? FOR UPDATE',
            [productId]
          );
          const product = rows[0];
          if (!product) throw httpError(400, 'One of the selected products no longer exists');
          if (product.stock < quantity) {
            throw httpError(400, `Only ${product.stock} unit(s) of ${product.name} are in stock`);
          }
          lines.push({ product, quantity });
        }
      } else {
        const [rows] = await connection.query(
          `SELECT c.product_id, c.quantity, p.*
           FROM cart c
           JOIN products p ON p.id = c.product_id
           WHERE c.user_id = ? AND c.saved_for_later = 0
           FOR UPDATE`,
          [req.user.id]
        );
        if (rows.length === 0) throw httpError(400, 'Your cart is empty');
        for (const row of rows) {
          if (row.stock < row.quantity) {
            throw httpError(400, `Only ${row.stock} unit(s) of ${row.name} are in stock`);
          }
          lines.push({
            product: row,
            quantity: row.quantity,
            cartId: row.id,
          });
        }
      }

      // ---- 2. Totals ----
      let gross = 0;
      let itemsTotal = 0;
      for (const line of lines) {
        gross += Number(line.product.original_price) * line.quantity;
        itemsTotal += Number(line.product.price) * line.quantity;
      }
      const discount = Math.round((gross - itemsTotal) * 100) / 100;
      const deliveryCharge = computeDeliveryCharge(itemsTotal);
      const totalAmount = Math.round((itemsTotal + deliveryCharge) * 100) / 100;

      // ---- 3. Create the order ----
      const history = JSON.stringify([
        { status: 'PLACED', at: new Date().toISOString() },
      ]);
      const [result] = await connection.query(
        `INSERT INTO orders
          (user_id, total_amount, status, status_history, customer_name, phone, address, city, pincode)
         VALUES (?, ?, 'PLACED', ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          totalAmount,
          history,
          String(customerName).trim(),
          String(phone).trim(),
          String(address).trim(),
          String(city).trim(),
          String(pincode).trim(),
        ]
      );
      const newOrderId = result.insertId;

      // ---- 4. Items + stock deduction ----
      for (const line of lines) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
           VALUES (?, ?, ?, ?, ?)`,
          [newOrderId, line.product.id, line.product.name, line.quantity, line.product.price]
        );
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
          line.quantity,
          line.product.id,
        ]);
      }

      // ---- 5. Clear the cart only for cart-based orders ----
      if (!buyNow) {
        await connection.query('DELETE FROM cart WHERE user_id = ? AND saved_for_later = 0', [
          req.user.id,
        ]);
      }

      return {
        id: newOrderId,
        summary: {
          gross,
          discount,
          itemsTotal,
          deliveryCharge,
          totalAmount,
        },
      };
    });

    const order = await loadOrder(orderId.id);
    res.status(201).json({ order, summary: orderId.summary });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - owner or seller
router.get('/:id', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!ownsOrder(order, req.user)) {
      return res.status(403).json({ message: 'Forbidden: you cannot view this order' });
    }
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id/track - tracking timeline for an order
router.get('/:id/track', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!ownsOrder(order, req.user)) {
      return res.status(403).json({ message: 'Forbidden: you cannot track this order' });
    }

    const history = order.statusHistory || [];
    const currentIndex = ORDER_STATUSES.indexOf(order.status);

    const stages = ORDER_STATUSES.map((status, index) => {
      const entry = history.find((h) => h.status === status);
      return {
        status,
        label: STATUS_LABELS[status],
        completed: index < currentIndex,
        current: index === currentIndex,
        at: entry ? entry.at : null,
      };
    });

    res.json({
      order: { ...order, statusHistory: undefined },
      stages,
      currentStatus: order.status,
      currentStatusLabel: STATUS_LABELS[order.status] || order.status,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status - seller only
router.put('/:id/status', requireSeller, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`,
      });
    }

    const existing = await getOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const history = safeParse(existing.status_history);
    if (!history.some((entry) => entry.status === status)) {
      history.push({ status, at: new Date().toISOString() });
    }

    await query('UPDATE orders SET status = ?, status_history = ? WHERE id = ?', [
      status,
      JSON.stringify(history),
      existing.id,
    ]);

    const order = await loadOrder(existing.id);
    res.json({ order, message: `Order marked as ${STATUS_LABELS[status]}` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.STATUS_LABELS = STATUS_LABELS;

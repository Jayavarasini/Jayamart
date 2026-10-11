// POST /api/payments - DEMO net banking payment (no real gateway).
const express = require('express');
const crypto = require('crypto');
const { query, getOne } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { DEMO_BANKS, PAYMENT_METHODS } = require('../config/constants');

const router = express.Router();

/** Realistic looking demo transaction id: JM20260924A1B2C3 */
function generateTransactionId() {
  const date = new Date();
  const stamp =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `JM${stamp}${random}`;
}

// POST /api/payments { orderId, paymentMethod, bank, accountName }
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { orderId, paymentMethod, bank, accountName } = req.body || {};
    const id = Number(orderId);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'A valid order id is required' });
    }
    if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Payment method must be NET_BANKING' });
    }
    if (!bank || !DEMO_BANKS.includes(bank)) {
      return res.status(400).json({ message: `Please select one of: ${DEMO_BANKS.join(', ')}` });
    }
    if (!accountName || !String(accountName).trim()) {
      return res.status(400).json({ message: 'Account holder name is required' });
    }

    const order = await getOne('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user_id !== req.user.id && req.user.role !== 'SELLER') {
      return res.status(403).json({ message: 'Forbidden: this order belongs to another user' });
    }

    const existing = await getOne(
      "SELECT id FROM payments WHERE order_id = ? AND status = 'SUCCESS'",
      [id]
    );
    if (existing) {
      return res.status(400).json({ message: 'This order has already been paid' });
    }

    const transactionId = generateTransactionId();
    const result = await query(
      `INSERT INTO payments (order_id, payment_method, amount, status, transaction_id, bank, account_name)
       VALUES (?, ?, ?, 'SUCCESS', ?, ?, ?)`,
      [
        id,
        paymentMethod,
        order.total_amount,
        transactionId,
        bank,
        String(accountName).trim(),
      ]
    );

    const payment = await getOne('SELECT * FROM payments WHERE id = ?', [result.insertId]);

    res.status(201).json({
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        paymentMethod: payment.payment_method,
        amount: Number(payment.amount),
        status: payment.status,
        transactionId: payment.transaction_id,
        bank: payment.bank,
        accountName: payment.account_name,
        createdAt: payment.created_at,
      },
      message: 'Payment successful (demo)',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

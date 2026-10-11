// GET/POST/PUT/DELETE /api/cart - each user only sees their own cart.
const express = require('express');
const { query, getOne } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { serializeCartItem } = require('../utils/serializer');

const router = express.Router();

router.use(authenticate);

const CART_SELECT = `
  SELECT c.id, c.user_id, c.product_id, c.quantity, c.saved_for_later,
         p.name, p.category, p.description, p.price, p.original_price,
         p.discount_percentage, p.stock, p.image
  FROM cart c
  JOIN products p ON p.id = c.product_id
`;

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(`${CART_SELECT} WHERE c.user_id = ? ORDER BY c.id DESC`, [req.user.id]);
    res.json({ items: rows.map(serializeCartItem) });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart { productId, quantity?, savedForLater? }
router.post('/', async (req, res, next) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity || 1);
    const savedForLater = Boolean(req.body.savedForLater);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'A valid product is required' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await getOne('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock <= 0) return res.status(400).json({ message: 'This product is out of stock' });

    const existing = await getOne('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [
      req.user.id,
      productId,
    ]);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} unit(s) of ${product.name} are in stock`,
        });
      }
      await query(
        'UPDATE cart SET quantity = ?, saved_for_later = ? WHERE id = ?',
        [newQuantity, savedForLater ? 1 : 0, existing.id]
      );
    } else {
      if (quantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} unit(s) of ${product.name} are in stock`,
        });
      }
      await query(
        'INSERT INTO cart (user_id, product_id, quantity, saved_for_later) VALUES (?, ?, ?, ?)',
        [req.user.id, productId, quantity, savedForLater ? 1 : 0]
      );
    }

    const rows = await query(`${CART_SELECT} WHERE c.user_id = ? ORDER BY c.id DESC`, [req.user.id]);
    res.status(201).json({ items: rows.map(serializeCartItem) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/:id { quantity?, savedForLater? }
router.put('/:id', async (req, res, next) => {
  try {
    const row = await getOne('SELECT * FROM cart WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (!row) return res.status(404).json({ message: 'Cart item not found' });

    const product = await getOne('SELECT * FROM products WHERE id = ?', [row.product_id]);
    if (!product) return res.status(404).json({ message: 'Product no longer available' });

    let quantity = row.quantity;
    if (req.body.quantity !== undefined) {
      quantity = Number(req.body.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      if (quantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} unit(s) left in stock` });
      }
    }

    let saved = row.saved_for_later;
    if (req.body.savedForLater !== undefined) {
      saved = Boolean(req.body.savedForLater) ? 1 : 0;
    }

    await query('UPDATE cart SET quantity = ?, saved_for_later = ? WHERE id = ?', [
      quantity,
      saved,
      row.id,
    ]);

    const rows = await query(`${CART_SELECT} WHERE c.user_id = ? ORDER BY c.id DESC`, [req.user.id]);
    res.json({ items: rows.map(serializeCartItem) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const row = await getOne('SELECT id FROM cart WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (!row) return res.status(404).json({ message: 'Cart item not found' });

    await query('DELETE FROM cart WHERE id = ?', [row.id]);
    const rows = await query(`${CART_SELECT} WHERE c.user_id = ? ORDER BY c.id DESC`, [req.user.id]);
    res.json({ items: rows.map(serializeCartItem) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

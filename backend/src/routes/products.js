// GET/POST/PUT/DELETE /api/products - browsing is public, management is seller-only.
const express = require('express');
const { query, getOne } = require('../config/db');
const { authenticate, requireSeller } = require('../middleware/auth');
const { serializeProduct, calculateDiscount } = require('../utils/serializer');
const { CATEGORIES } = require('../config/constants');

const router = express.Router();

// GET /api/products?search=...&category=...
router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();

    const where = [];
    const params = [];

    if (search) {
      where.push('(name LIKE ? OR category LIKE ? OR description LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (category && category !== 'All') {
      where.push('category = ?');
      params.push(category);
    }

    const sql = `
      SELECT * FROM products
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC, id DESC
    `;
    const rows = await query(sql, params);
    res.json({ products: rows.map(serializeProduct) });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const row = await getOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: serializeProduct(row) });
  } catch (error) {
    next(error);
  }
});

// Validate the product payload shared by create/update.
function validateProductPayload(body) {
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const originalPrice = Number(body.originalPrice);
  const stock = Number(body.stock);
  const image = String(body.image || '').trim();

  if (!name) return { error: 'Product name is required' };
  if (!category) return { error: 'Category is required' };
  if (!CATEGORIES.includes(category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(', ')}` };
  }
  if (!Number.isFinite(price) || price <= 0) return { error: 'Selling price must be greater than 0' };
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    return { error: 'Original price must be greater than 0' };
  }
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock cannot be negative' };

  return {
    value: {
      name,
      category,
      description,
      price,
      originalPrice,
      stock,
      image,
      discount: calculateDiscount(originalPrice, price),
    },
  };
}

// POST /api/products - seller only
router.post('/', authenticate, requireSeller, async (req, res, next) => {
  try {
    const check = validateProductPayload(req.body || {});
    if (check.error) return res.status(400).json({ message: check.error });
    const p = check.value;

    const result = await query(
      `INSERT INTO products
        (name, category, description, price, original_price, discount_percentage, stock, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.category, p.description, p.price, p.originalPrice, p.discount, p.stock, p.image || null]
    );

    const row = await getOne('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ product: serializeProduct(row) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - seller only
router.put('/:id', authenticate, requireSeller, async (req, res, next) => {
  try {
    const existing = await getOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const check = validateProductPayload(req.body || {});
    if (check.error) return res.status(400).json({ message: check.error });
    const p = check.value;

    await query(
      `UPDATE products
       SET name = ?, category = ?, description = ?, price = ?, original_price = ?,
           discount_percentage = ?, stock = ?, image = ?
       WHERE id = ?`,
      [p.name, p.category, p.description, p.price, p.originalPrice, p.discount, p.stock, p.image || null, existing.id]
    );

    const row = await getOne('SELECT * FROM products WHERE id = ?', [existing.id]);
    res.json({ product: serializeProduct(row) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - seller only
router.delete('/:id', authenticate, requireSeller, async (req, res, next) => {
  try {
    const existing = await getOne('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    await query('DELETE FROM products WHERE id = ?', [existing.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

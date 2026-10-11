// Seeds demo accounts and demo products the first time the app starts.
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { DEMO_USERS, DEMO_PRODUCTS } = require('../config/seedData');
const { calculateDiscount } = require('../utils/serializer');

async function seedDatabase() {
  // ---- demo accounts ----
  const userCount = await query('SELECT COUNT(*) AS count FROM users');
  if (Number(userCount[0].count) === 0) {
    for (const user of DEMO_USERS) {
      const hashed = await bcrypt.hash(user.password, 10);
      await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email, hashed, user.role]
      );
    }
    console.log('[seed] Demo accounts created');
  }

  // ---- demo products ----
  const productCount = await query('SELECT COUNT(*) AS count FROM products');
  if (Number(productCount[0].count) === 0) {
    for (const product of DEMO_PRODUCTS) {
      const discount = calculateDiscount(product.originalPrice, product.price);
      await query(
        `INSERT INTO products
          (name, category, description, price, original_price, discount_percentage, stock, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.category,
          product.description,
          product.price,
          product.originalPrice,
          discount,
          product.stock,
          product.image,
        ]
      );
    }
    console.log(`[seed] ${DEMO_PRODUCTS.length} demo products created`);
  }
}

module.exports = { seedDatabase };

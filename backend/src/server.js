// JayaMart backend entry point - Express REST API on top of MySQL.
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDatabase } = require('./config/db');
const { seedDatabase } = require('./db/seed');
const { notFound, errorHandler } = require('./middleware/errors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const sellerRoutes = require('./routes/seller');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);
app.use(express.json());

// ---- REST API ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'JayaMart API' });
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await initDatabase();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`JayaMart API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start JayaMart backend:', error.message);
    console.error(
      'Check the MySQL credentials in backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).'
    );
    process.exit(1);
  }
}

start();

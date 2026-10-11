// Authentication + role based authorization middleware.
const jwt = require('jsonwebtoken');
const { getOne } = require('../config/db');
const { serializeUser } = require('../utils/serializer');

const JWT_SECRET = process.env.JWT_SECRET || 'jayamart-dev-secret';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** Verifies the Bearer token and attaches req.user. */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const user = await getOne('SELECT * FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }

    req.user = serializeUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

/** Only SELLER accounts may pass. */
function requireSeller(req, res, next) {
  if (!req.user || req.user.role !== 'SELLER') {
    return res.status(403).json({ message: 'Forbidden: seller access only' });
  }
  next();
}

module.exports = { authenticate, requireSeller, signToken };

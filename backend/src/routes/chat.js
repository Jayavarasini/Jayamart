// POST /api/chat - JayaMart AI shopping assistant.
// Works for guests; attaches the user's real cart/orders only when a valid
// JWT is present. The AI provider is called server-side only (no key in the
// frontend) and every failure falls back to the built-in data assistant.
const express = require('express');
const jwt = require('jsonwebtoken');
const { getCatalogContext, getStoreRules, getUserContext } = require('../utils/chatContext');
const { askAI, buildSystemPrompt, localReply } = require('../utils/chatBrain');

const router = express.Router();

const MAX_MESSAGE = 800;
const MAX_HISTORY = 12;

/** Guests are allowed - a valid token only adds personal context. */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'jayamart-dev-secret');
    if (payload && payload.id) req.chatUserId = Number(payload.id);
  } catch {
    // Invalid/expired token -> continue as guest instead of failing the chat.
  }
  next();
}

/** Keep only { role, content } pairs, newest 12, bounded sizes. */
function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY)
    .map((entry) => ({
      role:
        entry && (entry.role === 'user' || entry.role === 'assistant') ? entry.role : null,
      content:
        entry && typeof entry.content === 'string' ? entry.content.trim().slice(0, 1000) : '',
    }))
    .filter((entry) => entry.role && entry.content);
}

// POST /api/chat  { message, history? }  ->  { reply, source, products }
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const message =
      typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (message.length > MAX_MESSAGE) {
      return res
        .status(400)
        .json({ message: `Message must be ${MAX_MESSAGE} characters or fewer` });
    }

    const history = sanitizeHistory(req.body?.history);
    const [catalog, user] = await Promise.all([
      getCatalogContext(),
      getUserContext(req.chatUserId || null),
    ]);
    const rules = getStoreRules();

    // 1) Preferred: the configured AI provider (key never leaves this server).
    if (process.env.AI_API_KEY) {
      try {
        const reply = await askAI({
          message,
          history,
          systemPrompt: buildSystemPrompt({ catalog, rules, user }),
        });
        return res.json({ reply, source: 'ai', products: [] });
      } catch (error) {
        // Never crash the site because of an AI outage - use local data instead.
        console.warn('[chat] AI provider unavailable, using local assistant:', error.message);
      }
    }

    // 2) Built-in assistant answering from the real JayaMart database.
    const result = localReply({ message, catalog, rules, user });
    res.json({ reply: result.reply, source: 'local', products: result.products });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

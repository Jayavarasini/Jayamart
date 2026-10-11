// JayaMart shopping assistant brain:
//  1. askAI()         - calls the configured OpenAI-compatible AI provider (backend only).
//  2. localReply()    - safe fallback that answers from REAL JayaMart data (never invents).

// ---------------------------------------------------------------------------
// AI provider (enabled only when AI_API_KEY is set in backend/.env)
// ---------------------------------------------------------------------------

async function askAI({ message, history = [], systemPrompt }) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY is not configured');

  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`AI provider returned ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply || !String(reply).trim()) throw new Error('AI provider returned an empty reply');
    return String(reply).trim();
  } finally {
    clearTimeout(timer);
  }
}

/** System prompt carrying the full real-data context for the AI. */
function buildSystemPrompt({ catalog, rules, user }) {
  const context = {
    store: {
      name: 'JayaMart',
      tagline: 'Find it. Love it. Buy it',
      categories: catalog.categories,
      deliveryCharge: rules.deliveryCharge,
      freeDeliveryMin: rules.freeDeliveryMin,
      lowStockThreshold: rules.lowStockThreshold,
      orderStatuses: rules.orderStatuses,
      payment: rules.paymentMethod,
      support: rules.supportEmail,
      faq: rules.faq,
    },
    products: catalog.products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercentage: p.discountPercentage,
      stock: p.stock,
    })),
    activeOffers: catalog.offers.slice(0, 15),
    signedInUser: user,
  };

  return [
    'You are "JayaMart Assistant", the friendly shopping helper inside the JayaMart online supermarket website.',
    'You help users find products, compare prices, check stock, understand offers, delivery/payment, checkout steps and their orders.',
    '',
    'STRICT RULES:',
    '- Use ONLY the real JayaMart data in the CONTEXT below. NEVER invent product names, prices, discounts, stock, offers, order details or policies.',
    '- If something is not in the context, say you do not have that information in this demo instead of guessing.',
    '- For cart or order questions when signedInUser is null, ask the user to log in first.',
    '- For the signed-in user, answer cart/order questions only from signedInUser.cart / signedInUser.recentOrders.',
    '- Never ask for or repeat personal details (address, phone, email).',
    '- Prices are in rupees, write them like "Rs. 249".',
    '- Keep replies friendly and concise (max ~120 words), plain text with short line breaks. No markdown tables.',
  ].join('\n') + '\n\nCONTEXT (real JayaMart data):\n' + JSON.stringify(context);
}

// ---------------------------------------------------------------------------
// Local fallback assistant - intent matching over the same real data
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those', 'of', 'in', 'on', 'to', 'for',
  'with', 'and', 'or', 'not', 'no', 'do', 'does', 'did', 'can', 'could', 'would', 'should',
  'please', 'show', 'give', 'find', 'get', 'some', 'any', 'what', 'which', 'how', 'much', 'many',
  'need', 'want', 'buy', 'looking', 'look', 'looked', 'product', 'products', 'item', 'items',
  'price', 'prices', 'cost', 'costs', 'stock', 'available', 'availability', 'under', 'below',
  'above', 'less', 'than', 'rs', 'rupees', 'from', 'at', 'by', 'all', 'top', 'best', 'new',
  'list', 'tell', 'about', 'the', 'have', 'has', 'there', 'one', 'ones', 'only', 'just', 'also',
]);

function stockLabel(stock, lowThreshold) {
  if (stock <= 0) return 'Out of stock';
  if (stock < lowThreshold) return `Only ${stock} left`;
  return 'In stock';
}

/** Extract a price cap like "under 200" / "below Rs. 500". */
function extractPriceCap(text) {
  const match =
    text.match(/(?:under|below|less than|within|upto|up to|max|maximum)\s*(?:rs\.?|\u20b9|rupees)?\s*(\d{2,5})/i) ||
    text.match(/(?:rs\.?|\u20b9)\s*(\d{2,5})\s*(?:or)\s*(?:less|below|under)/i);
  return match ? Number(match[1]) : null;
}

/** Score catalog products against the user's words (name > category > description). */
function matchProducts(text, catalog) {
  const lower = text.toLowerCase();
  const priceCap = extractPriceCap(lower);
  const tokens = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const categoryHit = catalog.categories.find((c) => lower.includes(c.name.toLowerCase()));

  const scored = [];
  for (const product of catalog.products) {
    if (priceCap !== null && product.price > priceCap) continue;
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    const description = product.description.toLowerCase();
    let score = categoryHit && product.category === categoryHit.name ? 3 : 0;
    for (const token of tokens) {
      if (name.includes(token)) score += 3;
      else if (category.includes(token)) score += 2;
      else if (description.includes(token)) score += 1;
    }
    if (score > 0) scored.push({ product, score });
  }

  const cheapFirst = /cheap|cheapest|lowest|budget|affordable/.test(lower);
  scored.sort((a, b) => {
    if (cheapFirst && a.product.price !== b.product.price) return a.product.price - b.product.price;
    if (b.score !== a.score) return b.score - a.score;
    return b.product.discountPercentage - a.product.discountPercentage;
  });

  return { matches: scored.map((s) => s.product), priceCap };
}

function productLine(product, rules) {
  const off =
    product.discountPercentage > 0
      ? `, MRP Rs. ${product.originalPrice} (${product.discountPercentage}% off)`
      : '';
  return `\u2022 ${product.name} (${product.category}) - Rs. ${product.price}${off} - ${stockLabel(
    product.stock,
    rules.lowStockThreshold
  )}`;
}

function guestNudge(what) {
  return `You're browsing as a guest, so I can't show ${what} yet. Log in at /login (or register at /register) and ask me again - I'll answer straight from your real account.`;
}

/** Rule-based reply built exclusively from real JayaMart data. */
function localReply({ message, catalog, rules, user }) {
  const text = message.toLowerCase().trim();
  const { matches, priceCap } = matchProducts(message, catalog);
  const capNote = priceCap !== null ? ` (max Rs. ${priceCap})` : '';

  const wantsStock = /\b(stock|available|availability|in stock|out of stock|left)\b/.test(text);
  const wantsPrice = /\b(price|cost|rate|how much)\b/.test(text);

  const listProducts = (title, items) =>
    `${title}${capNote}:\n${items.map((p) => productLine(p, rules)).join('\n')}\n\nTap a product card below to open its page.`;

  // 1. Short greeting / farewell -------------------------------------------
  if (/^(hi|hello|hey|namaste|hola|yo|hii+)\b/.test(text) && text.length < 20) {
    return {
      reply:
        "Hello! I'm the JayaMart Assistant \ud83d\uded2\ufe0f\nI can help you find products, check prices and stock, see live offers, and understand delivery, payment and orders.\nWhat are you looking for today?",
      products: [],
    };
  }
  if (/^(thanks|thank you|thankyou|ty|bye|goodbye|see you)\b/.test(text) && text.length < 25) {
    return {
      reply: "You're welcome! Happy shopping at JayaMart \ud83d\udc98 Anything else I can help you find?",
      products: [],
    };
  }

  // 2. What can you do ------------------------------------------------------
  if (/\b(what can you (do|help)|help me|how (do|does) you work|capabilities|features)\b/.test(text)) {
    return {
      reply:
        'I can assist with:\n\u2022 Finding products and comparing prices\n\u2022 Checking stock / availability\n\u2022 Today\'s offers and discounts\n\u2022 Delivery charges and free-delivery rules\n\u2022 Checkout and payment guidance\n\u2022 Your cart and recent orders (after login)\n\u2022 Order tracking guidance\n\nJust type what you need, e.g. "snacks under Rs. 200".',
      products: [],
    };
  }

  // 3. Cart questions -------------------------------------------------------
  if (/\bcart\b/.test(text) || /\bsaved for later\b/.test(text)) {
    if (!user || !user.signedIn) return { reply: guestNudge('your cart'), products: [] };
    const cart = user.cart;
    if (!cart || cart.items.length === 0) {
      return {
        reply:
          'Your cart is empty right now.\nBrowse /products and use "Add to Cart" - I can also suggest items, just tell me what you need!',
        products: [],
      };
    }
    const lines = cart.items.map(
      (item) => `\u2022 ${item.name} x ${item.quantity} - Rs. ${item.price * item.quantity}`
    );
    const savedNote =
      cart.savedForLaterCount > 0
        ? `\n\nYou also have ${cart.savedForLaterCount} item(s) saved for later.`
        : '';
    return {
      reply:
        `Here's your cart:\n${lines.join('\n')}\n\nSubtotal: Rs. ${cart.subtotal}\n` +
        `Delivery: ${cart.deliveryCharge === 0 ? 'FREE' : `Rs. ${cart.deliveryCharge}`}\nTotal: Rs. ${cart.total}${savedNote}\n\n` +
        `Delivery is free above Rs. ${rules.freeDeliveryMin}. Head to /checkout whenever you're ready!`,
      products: cart.items.map((item) => {
        const full = catalog.products.find((p) => p.id === item.productId);
        return (
          full || {
            id: item.productId,
            name: item.name,
            price: item.price,
            category: '',
            stock: 0,
            image: null,
          }
        );
      }),
    };
  }

  // 4. Delivery charges -----------------------------------------------------
  if (
    /\b(free delivery|delivery (charge|fee|cost|price)s?|shipping (charge|fee|cost|price)s?|how much (is|for) (delivery|shipping))\b/.test(text)
  ) {
    return {
      reply:
        `Delivery at JayaMart costs Rs. ${rules.deliveryCharge} per order.\n` +
        `It's FREE on orders of Rs. ${rules.freeDeliveryMin} or more - so add one more item if you're close!\n\n` +
        'After ordering, track the package live from /orders.',
      products: [],
    };
  }

  // 5. Payment guidance -----------------------------------------------------
  if (/\b(payment|pay|net ?banking|upi|card|debit|credit|cod|cash on delivery)\b/.test(text)) {
    return {
      reply:
        `JayaMart uses ${rules.paymentMethod}.\n\nHow to pay:\n` +
        '1. Add items to cart and go to /checkout\n2. Fill in the delivery address\n' +
        '3. Continue to /payment, pick your bank and confirm\n4. You get a transaction id (e.g. JM123456XYZ) and the order is marked PAID.\n\n' +
        'This is an academic demo, so no real money moves.',
      products: [],
    };
  }

  // 6. Checkout guidance ----------------------------------------------------
  if (/\b(checkout|how to (buy|place|make) (an )?order|place (an )?order|purchase|order process)\b/.test(text)) {
    return {
      reply:
        'Placing an order on JayaMart takes 4 steps:\n' +
        '1. Add items to your cart (or hit "Buy Now" on a product)\n2. Review everything on /cart\n' +
        '3. Enter the delivery address on /checkout\n4. Pay on /payment (Net Banking demo)\n\n' +
        "You'll land on /order-success with your order id, and can follow it on /orders.",
      products: [],
    };
  }

  // 7. Orders / tracking ----------------------------------------------------
  if (/\b(order|track|tracking|shipment|shipment status|my orders|where is)\b/.test(text) && !/order process/.test(text)) {
    if (!user || !user.signedIn) return { reply: guestNudge('your orders'), products: [] };
    const orders = user.recentOrders || [];
    if (orders.length === 0) {
      return {
        reply:
          "You don't have any orders yet.\nAdd something you love to the cart and place your first order - then you can track it here!",
        products: [],
      };
    }
    const lines = orders.map(
      (o) => `\u2022 Order #${o.orderId} - ${o.status.replace(/_/g, ' ').toLowerCase()} - Rs. ${o.total} (${o.placedOn})`
    );
    return {
      reply:
        `Here are your recent orders:\n${lines.join('\n')}\n\n` +
        `Statuses move through: ${rules.orderStatuses.join(' \u2192 ')}.\n` +
        'Open /orders (or /order/<id>) for live tracking with timestamps. Need details on a specific order? Ask me its number.',
      products: [],
    };
  }

  // 8. Offers / discounts ---------------------------------------------------
  if (/\b(offer|offers|deal|deals|discount|coupon|sale|promo|cashback|combo)\b/.test(text)) {
    const top = catalog.offers.slice(0, 5);
    if (top.length === 0) {
      return {
        reply: `No discounted products right now - but delivery is still FREE above Rs. ${rules.freeDeliveryMin}!`,
        products: [],
      };
    }
    const lines = top.map(
      (p) => `\u2022 ${p.name} - Rs. ${p.price} (${p.discountPercentage}% off, was Rs. ${catalog.products.find((x) => x.id === p.id).originalPrice})`
    );
    return {
      reply:
        `Live offers at JayaMart:\n${lines.join('\n')}\n\n` +
        `Plus: FREE delivery on orders of Rs. ${rules.freeDeliveryMin}+.\nAsk me for offers in a category, e.g. "makeup offers".`,
      products: top.map((p) => catalog.products.find((x) => x.id === p.id)),
    };
  }

  // 9. Categories -----------------------------------------------------------
  if (/\b(categor(?:y|ies)|what do you (sell|have)|product range|departments|sections|how many products)\b/.test(text)) {
    const lines = catalog.categories.map((c) => `\u2022 ${c.name} - ${c.productCount} products`);
    return {
      reply: `JayaMart stocks ${catalog.products.length} products across ${catalog.categories.length} categories:\n${lines.join('\n')}\n\nAsk me for products in any category, e.g. "show me stationery".`,
      products: [],
    };
  }

  // 10. Account / roles -----------------------------------------------------
  if (/\b(login|log in|sign in|register|account|password|signup|sign up|buyer|seller|role)\b/.test(text)) {
    return {
      reply:
        'JayaMart accounts are simple:\n\u2022 Register at /register, then log in at /login.\n' +
        '\u2022 BUYER: shop, checkout and track orders.\n\u2022 SELLER: manage products, stock and order status from /seller.\n\n' +
        'Your session stays valid for 7 days. Already registered? Log in to see your cart and orders here in the chat.',
      products: [],
    };
  }

  // 11. Product search / price / availability -------------------------------
  if (matches.length > 0) {
    const shown = matches.slice(0, 5);
    const hidden = matches.length - shown.length;
    let title;
    if (wantsStock) title = 'Availability for your search';
    else if (wantsPrice) title = 'Prices for your search';
    else title = 'Products I found for you';
    let reply = listProducts(title, shown);
    if (hidden > 0) reply += `\n(+${hidden} more on /products)`;
    return { reply, products: shown };
  }

  // 12. Fallback ------------------------------------------------------------
  return {
    reply:
      "Sorry, I couldn't find that in the JayaMart catalog.\n\nTry asking me:\n" +
      '\u2022 "snacks under Rs. 200"\n\u2022 "Show me makeup offers"\n\u2022 "Is the rice in stock?"\n' +
      '\u2022 "What are the delivery charges?"\n\u2022 "Track my order"\n\nYou can also browse /products directly.',
    products: [],
  };
}

module.exports = { askAI, buildSystemPrompt, localReply };

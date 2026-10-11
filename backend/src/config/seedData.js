// Demo data for JayaMart: demo accounts + seed products for every category.
// Product images are real photos in frontend/public/images/*.jpg
// (generated SVG tiles in /images/*.svg remain as an offline fallback).

const DEMO_USERS = [
  {
    name: 'Demo Buyer',
    email: 'buyer@jayamart.com',
    password: 'buyer123',
    role: 'BUYER',
  },
  {
    name: 'Demo Seller',
    email: 'seller@jayamart.com',
    password: 'seller123',
    role: 'SELLER',
  },
];

// price        = selling price (what the customer pays)
// originalPrice = MRP (used to show the discount)
// stock        = deliberately mixed: high stock, low stock (<10) and one out-of-stock
const DEMO_PRODUCTS = [
  // ---------------- Grocery ----------------
  {
    name: 'Sona Masoori Rice 5 kg',
    category: 'Grocery',
    description:
      'Aged Sona Masoori rice with a soft texture and natural aroma. Ideal for everyday meals, pulao and biryani. Double-cleaned and packed fresh at the mill.',
    price: 420,
    originalPrice: 520,
    stock: 60,
    image: '/images/sona-masoori-rice.jpg',
  },
  {
    name: 'Premium Wheat Flour 10 kg',
    category: 'Grocery',
    description:
      '100% whole wheat atta milled from carefully selected golden wheat. Makes soft rotis that stay fluffy for hours. No maida, no additives.',
    price: 480,
    originalPrice: 560,
    stock: 45,
    image: '/images/premium-wheat-flour.jpg',
  },
  {
    name: 'Sunflower Cooking Oil 1 L',
    category: 'Grocery',
    description:
      'Light, cholesterol-free sunflower oil rich in vitamin E. Perfect for daily cooking, frying and baking with a clean, neutral taste.',
    price: 135,
    originalPrice: 160,
    stock: 80,
    image: '/images/sunflower-cooking-oil.jpg',
  },
  {
    name: 'Organic Cane Sugar 1 kg',
    category: 'Grocery',
    description:
      'Unrefined organic cane sugar crystals that retain natural minerals. A cleaner sweetener for tea, coffee, desserts and baking.',
    price: 52,
    originalPrice: 65,
    stock: 8,
    image: '/images/organic-cane-sugar.jpg',
  },
  {
    name: 'Toor Dal (Arhar) 1 kg',
    category: 'Grocery',
    description:
      'Premium grade split toor dal, hand-graded and machine-cleaned. Cooks evenly into creamy, protein-rich dal for the whole family.',
    price: 145,
    originalPrice: 175,
    stock: 30,
    image: '/images/toor-dal.jpg',
  },

  // ---------------- Fragrance ----------------
  {
    name: 'Midnight Bloom Perfume 100 ml',
    category: 'Fragrance',
    description:
      'A long-lasting evening fragrance that opens with bergamot and settles into soft musk and vanilla. Sophisticated, warm and unmistakably modern.',
    price: 749,
    originalPrice: 999,
    stock: 25,
    image: '/images/midnight-bloom-perfume.jpg',
  },
  {
    name: 'Ocean Fresh Body Spray 150 ml',
    category: 'Fragrance',
    description:
      'Crisp aquatic notes with a hint of sea salt for an all-day fresh feeling. Quick-dry formula that never feels sticky.',
    price: 299,
    originalPrice: 399,
    stock: 6,
    image: '/images/ocean-fresh-body-spray.jpg',
  },
  {
    name: 'Cedar Wood Deodorant 200 ml',
    category: 'Fragrance',
    description:
      'Warm cedar wood and amber in an aluminium-free roll-on. Provides 48-hour odour protection with a smooth, non-staining application.',
    price: 349,
    originalPrice: 449,
    stock: 40,
    image: '/images/cedar-wood-deodorant.jpg',
  },
  {
    name: 'Rose Elan Eau de Parfum 50 ml',
    category: 'Fragrance',
    description:
      'Fresh rose petals layered over white tea and light woods. A graceful daytime signature scent that lasts through the evening.',
    price: 1199,
    originalPrice: 1499,
    stock: 15,
    image: '/images/rose-elan-eau-de-parfum.jpg',
  },
  {
    name: 'Vanilla Dream Body Mist 200 ml',
    category: 'Fragrance',
    description:
      'A light mist of creamy vanilla and coconut that refreshes skin instantly. Perfect for daily use and quick touch-ups.',
    price: 279,
    originalPrice: 359,
    stock: 0,
    image: '/images/vanilla-dream-body-mist.jpg',
  },

  // ---------------- Juice ----------------
  {
    name: 'Alphonso Mango Juice 1 L',
    category: 'Juice',
    description:
      'Pressed from ripe Alphonso mangoes with no added preservatives. Naturally sweet, thick and refreshing served chilled.',
    price: 180,
    originalPrice: 220,
    stock: 50,
    image: '/images/alphonso-mango-juice.jpg',
  },
  {
    name: 'Fresh Orange Juice 1 L',
    category: 'Juice',
    description:
      '100% squeezed oranges with pulp, fortified with vitamin C. Nothing artificial - just bright, zesty juice in every glass.',
    price: 160,
    originalPrice: 200,
    stock: 35,
    image: '/images/fresh-orange-juice.jpg',
  },
  {
    name: 'Kashmiri Apple Juice 1 L',
    category: 'Juice',
    description:
      'Juice from hand-picked Kashmiri apples, cold-pressed to lock in the natural flavour. Gently sweet with a crisp finish.',
    price: 210,
    originalPrice: 260,
    stock: 7,
    image: '/images/kashmiri-apple-juice.jpg',
  },
  {
    name: 'Mixed Fruit Juice 500 ml',
    category: 'Juice',
    description:
      'A cheerful blend of apple, grape, mango and pineapple. A lunchbox-friendly pack kids genuinely finish to the last drop.',
    price: 95,
    originalPrice: 120,
    stock: 60,
    image: '/images/mixed-fruit-juice.jpg',
  },
  {
    name: 'Pomegranate Juice 500 ml',
    category: 'Juice',
    description:
      'Deep red pomegranate juice with a naturally tangy-sweet profile. Rich in antioxidants and best served over ice.',
    price: 140,
    originalPrice: 175,
    stock: 22,
    image: '/images/pomegranate-juice.jpg',
  },

  // ---------------- Ice Cream ----------------
  {
    name: 'Classic Vanilla Ice Cream 1 L',
    category: 'Ice Cream',
    description:
      'Smooth French-style vanilla made with real bean specks. Creamy, mellow and made for pairing with warm brownies or fruit.',
    price: 220,
    originalPrice: 260,
    stock: 30,
    image: '/images/classic-vanilla-ice-cream.jpg',
  },
  {
    name: 'Belgian Chocolate Ice Cream 1 L',
    category: 'Ice Cream',
    description:
      'Dark cocoa ice cream folded with rich Belgian chocolate chunks. Deep, fudgy flavour without being overly sweet.',
    price: 280,
    originalPrice: 340,
    stock: 18,
    image: '/images/belgian-chocolate-ice-cream.jpg',
  },
  {
    name: 'Strawberry Swirl Ice Cream 1 L',
    category: 'Ice Cream',
    description:
      'Creamy strawberry ice cream ribbed with real fruit compote. A bright, summery scoop the whole family reaches for first.',
    price: 250,
    originalPrice: 300,
    stock: 5,
    image: '/images/strawberry-swirl-ice-cream.jpg',
  },
  {
    name: 'Butterscotch Blast 500 ml',
    category: 'Ice Cream',
    description:
      'Butterscotch ice cream loaded with crunchy caramelised praline bits. Buttery, crunchy and dangerously easy to finish.',
    price: 150,
    originalPrice: 180,
    stock: 40,
    image: '/images/butterscotch-blast.jpg',
  },
  {
    name: 'Mango Sorbet 500 ml',
    category: 'Ice Cream',
    description:
      'Dairy-free sorbet churned with real mango pulp. Light, icy and intensely fruity - a perfect palate cleanser.',
    price: 160,
    originalPrice: 199,
    stock: 12,
    image: '/images/mango-sorbet.jpg',
  },

  // ---------------- Snacks ----------------
  {
    name: 'Masala Potato Chips 150 g',
    category: 'Snacks',
    description:
      'Thick-cut chips dusted with a tangy chaat masala blend. Fried fresh in sunflower oil and sealed while still warm.',
    price: 40,
    originalPrice: 50,
    stock: 120,
    image: '/images/masala-potato-chips.jpg',
  },
  {
    name: 'Butter Cookies 250 g',
    category: 'Snacks',
    description:
      'Shortbread-style cookies made with real butter and a touch of vanilla. Crisp edges, melt-in-the-mouth centre.',
    price: 99,
    originalPrice: 130,
    stock: 55,
    image: '/images/butter-cookies.jpg',
  },
  {
    name: 'Salted Popcorn 200 g',
    category: 'Snacks',
    description:
      'Movie-night popcorn popped from premium kernels and lightly salted. Air-popped for a lighter, crunchier bite.',
    price: 70,
    originalPrice: 90,
    stock: 9,
    image: '/images/salted-popcorn.jpg',
  },
  {
    name: 'Chocolate Cream Cookies 200 g',
    category: 'Snacks',
    description:
      'Crunchy cocoa biscuits sandwiched around a smooth chocolate cream. Dunkable, shareable and always gone too soon.',
    price: 85,
    originalPrice: 110,
    stock: 70,
    image: '/images/chocolate-cream-cookies.jpg',
  },
  {
    name: 'Roasted Almonds 200 g',
    category: 'Snacks',
    description:
      'Californian almonds slow-roasted and lightly salted. A protein-rich snack for study sessions, hikes and mid-day hunger.',
    price: 240,
    originalPrice: 300,
    stock: 4,
    image: '/images/roasted-almonds.jpg',
  },
  {
    name: 'Cheese Crackers 180 g',
    category: 'Snacks',
    description:
      'Oven-baked crackers with real cheese baked into every square. Savoury, snappy and dangerously moreish with tea.',
    price: 60,
    originalPrice: 75,
    stock: 45,
    image: '/images/cheese-crackers.jpg',
  },

  // ---------------- Stationery ----------------
  {
    name: 'Ruled Notebook 200 Pages',
    category: 'Stationery',
    description:
      'Single-line ruled notebook with 200 acid-free pages, thread binding and a water-resistant cover. Lies flat while writing.',
    price: 120,
    originalPrice: 160,
    stock: 90,
    image: '/images/ruled-notebook.jpg',
  },
  {
    name: 'Smooth Gel Pens - Pack of 10',
    category: 'Stationery',
    description:
      'Quick-dry 0.7 mm gel pens with a comfortable grip. Deep ink flow that does not smudge, even for left-handed writers.',
    price: 90,
    originalPrice: 120,
    stock: 8,
    image: '/images/gel-pens.jpg',
  },
  {
    name: 'HB Wood Pencils - Pack of 5',
    category: 'Stationery',
    description:
      'Kiln-dried cedar pencils with a strong HB lead that resists breakage. Sharpens cleanly for writing and sketching.',
    price: 50,
    originalPrice: 65,
    stock: 150,
    image: '/images/hb-wood-pencils.jpg',
  },
  {
    name: 'Dual Tip Marker Set - 6 Shades',
    category: 'Stationery',
    description:
      'Brush tip on one end, fine tip on the other, in six coordinated shades. Water-based ink ideal for notes and journaling.',
    price: 180,
    originalPrice: 230,
    stock: 6,
    image: '/images/dual-tip-markers.jpg',
  },
  {
    name: 'Metal Geometry Box',
    category: 'Stationery',
    description:
      'Durable metal case with compass, divider, protractor, set squares and a ruler. Everything an exam kit needs in one box.',
    price: 250,
    originalPrice: 320,
    stock: 20,
    image: '/images/metal-geometry-box.jpg',
  },

  // ---------------- Makeup ----------------
  {
    name: 'Matte Lipstick - Ruby Red',
    category: 'Makeup',
    description:
      'High-pigment matte lipstick with a weightless feel. One swipe delivers opaque colour that stays put through meals.',
    price: 399,
    originalPrice: 549,
    stock: 28,
    image: '/images/matte-lipstick-ruby-red.jpg',
  },
  {
    name: 'Deep Black Kajal',
    category: 'Makeup',
    description:
      'Smudge-proof, waterproof kajal with an intensely black payoff. Ophthalmologist tested and gentle on sensitive eyes.',
    price: 199,
    originalPrice: 260,
    stock: 45,
    image: '/images/deep-black-kajal.jpg',
  },
  {
    name: 'Compact Powder - Ivory',
    category: 'Makeup',
    description:
      'Silky pressed compact that sets makeup and controls shine for hours. Comes with a mirror and soft puff in a slim case.',
    price: 349,
    originalPrice: 449,
    stock: 3,
    image: '/images/compact-powder-ivory.jpg',
  },
  {
    name: 'Liquid Foundation - Warm Beige',
    category: 'Makeup',
    description:
      'Buildable medium-to-full coverage foundation with a natural satin finish. Blends easily and never settles into fine lines.',
    price: 499,
    originalPrice: 649,
    stock: 16,
    image: '/images/liquid-foundation-warm-beige.jpg',
  },
  {
    name: 'Nude Shade Lip Gloss',
    category: 'Makeup',
    description:
      'Non-sticky lip gloss in a universally flattering nude. Delivers a soft plump look with a comfortable, cushiony feel.',
    price: 249,
    originalPrice: 329,
    stock: 35,
    image: '/images/nude-lip-gloss.jpg',
  },
];

module.exports = { DEMO_USERS, DEMO_PRODUCTS };

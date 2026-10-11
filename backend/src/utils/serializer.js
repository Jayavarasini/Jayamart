// Small shared helpers (serialisation + pricing maths).

/** Convert a product row (snake_case) into the API shape (camelCase). */
function serializeProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    discountPercentage: Number(row.discount_percentage),
    stock: row.stock,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert a user row into the public API shape (never leaks the password). */
function serializeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

/** Convert a cart row (joined with its product) into the API shape. */
function serializeCartItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    savedForLater: Boolean(row.saved_for_later),
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    discountPercentage: Number(row.discount_percentage),
    stock: row.stock,
    image: row.image,
  };
}

/** Discount % given the original price and the selling price. */
function calculateDiscount(originalPrice, price) {
  const original = Number(originalPrice);
  const selling = Number(price);
  if (!original || original <= 0 || !selling || selling < 0) return 0;
  if (selling >= original) return 0;
  return Math.round(((original - selling) / original) * 10000) / 100;
}

module.exports = {
  serializeProduct,
  serializeUser,
  serializeCartItem,
  calculateDiscount,
};

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import ProductImage from './ProductImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, stockLabel } from '../lib/format';

/**
 * Product card used across home, listing and related-product grids.
 * Shows Add to Cart + Buy Now (direct checkout) buttons.
 */
export default function ProductCard({ product }) {
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [busy, setBusy] = useState(false);
  const out = product.stock <= 0;
  const stock = stockLabel(product.stock);

  function requireLogin() {
    toast.info('Please log in to continue');
    navigate('/login', { state: { from: location.pathname + location.search } });
  }

  async function handleAddToCart() {
    if (!user) return requireLogin();
    setBusy(true);
    try {
      await cart.add(product.id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  function handleBuyNow() {
    if (!user) return requireLogin();
    navigate(`/checkout?productId=${product.id}&qty=1`);
  }

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-lift">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        <ProductImage
          product={product}
          className="h-44 w-full transition duration-300 group-hover:scale-105 sm:h-48"
        />
        {product.discountPercentage > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-lavender-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {Math.round(product.discountPercentage)}% OFF
          </span>
        )}
        {out && (
          <span className="absolute right-3 top-3 rounded-full bg-navy-900/80 px-2.5 py-1 text-xs font-bold text-white">
            Out of Stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-bold uppercase tracking-wide text-lavender-700">
          {product.category}
        </span>

        <Link
          to={`/product/${product.id}`}
          className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-navy-900 hover:text-navy-700"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-extrabold text-navy-900">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-navy-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-1.5">
          <span
            className={`chip ${
              stock.tone === 'rose'
                ? 'bg-rose-50 text-rose-600'
                : stock.tone === 'amber'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {stock.text}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={out || busy}
            className="btn-outline px-2 text-xs sm:text-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            {busy ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={out}
            className="btn-primary px-2 text-xs sm:text-sm"
          >
            <Zap className="h-4 w-4" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

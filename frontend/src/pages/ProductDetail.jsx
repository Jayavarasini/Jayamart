import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Zap, BookmarkPlus, ArrowLeft, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import QuantityStepper from '../components/QuantityStepper';
import { Spinner, ErrorState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, stockLabel } from '../lib/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setQuantity(1);

    (async () => {
      try {
        const data = await api(`/products/${id}`);
        if (!active) return;
        setProduct(data.product);

        const list = await api('/products');
        if (active) {
          setRelated(
            list.products
              .filter((item) => item.category === data.product.category && item.id !== data.product.id)
              .slice(0, 4)
          );
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner label="Loading product..." />;
  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error || 'Product not found'} />
        <div className="mt-6 text-center">
          <Link to="/products" className="btn-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const out = product.stock <= 0;
  const stock = stockLabel(product.stock);
  const maxQty = Math.max(product.stock, 1);

  function requireLogin() {
    toast.info('Please log in to continue');
    navigate('/login', { state: { from: location.pathname } });
  }

  async function handleAddToCart() {
    if (!user) return requireLogin();
    setBusy('cart');
    try {
      await cart.add(product.id, quantity);
      toast.success(`${quantity} × ${product.name} added to cart`);
    } catch (error_) {
      toast.error(error_.message);
    } finally {
      setBusy('');
    }
  }

  function handleBuyNow() {
    if (!user) return requireLogin();
    navigate(`/checkout?productId=${product.id}&qty=${quantity}`);
  }

  async function handleSaveForLater() {
    if (!user) return requireLogin();
    setBusy('save');
    try {
      await cart.add(product.id, quantity, true);
      toast.success('Saved for later');
    } catch (error_) {
      toast.error(error_.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> Go back
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image */}
        <div className="card overflow-hidden">
          <ProductImage product={product} className="h-72 w-full sm:h-96 lg:h-[28rem]" emojiClass="text-8xl" />
        </div>

        {/* Details */}
        <div className="card p-6 sm:p-8">
          <span className="chip bg-lavender-100 text-lavender-800">{product.category}</span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold text-navy-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-navy-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
                <span className="chip bg-lavender-600 text-white">
                  {Math.round(product.discountPercentage)}% OFF
                </span>
                <span className="text-sm font-semibold text-emerald-700">
                  You save {formatCurrency(product.originalPrice - product.price)}
                </span>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
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
            {product.stock > 0 && product.stock < 10 && (
              <span className="text-xs font-medium text-amber-700">
                Hurry - limited stock available
              </span>
            )}
          </div>

          <p className="mt-5 leading-7 text-navy-600">{product.description}</p>

          {/* Quantity */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-semibold text-navy-800">Quantity</span>
            <QuantityStepper
              value={quantity}
              max={maxQty}
              onChange={(next) => setQuantity(Math.min(Math.max(next, 1), maxQty))}
              disabled={out}
            />
            {out && <span className="text-sm font-semibold text-rose-600">Out of Stock</span>}
          </div>

          {/* Actions */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={out || busy === 'cart'}
              className="btn-outline py-3"
            >
              <ShoppingCart className="h-4 w-4" />
              {busy === 'cart' ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={out}
              className="btn-primary py-3"
            >
              <Zap className="h-4 w-4" /> Buy Now
            </button>
          </div>
          <button
            type="button"
            onClick={handleSaveForLater}
            disabled={out || busy === 'save'}
            className="btn-secondary mt-3 w-full py-3"
          >
            <BookmarkPlus className="h-4 w-4" />
            {busy === 'save' ? 'Saving...' : 'Save for Later'}
          </button>

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5 text-center text-[11px] font-semibold text-navy-500">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="h-5 w-5 text-lavender-600" /> Fast delivery
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-lavender-600" /> Quality checked
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RotateCcw className="h-5 w-5 text-lavender-600" /> Easy replacement
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy-900">More in {product.category}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

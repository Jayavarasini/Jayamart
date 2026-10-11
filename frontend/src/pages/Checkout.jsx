import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import ProductImage from '../components/ProductImage';
import { Spinner, EmptyState, ErrorState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, computeTotals } from '../lib/format';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const buyNowId = Number(searchParams.get('productId'));
  const buyNowQty = Math.max(Number(searchParams.get('qty') || 1), 1);
  const isBuyNow = Number.isInteger(buyNowId) && buyNowId > 0;

  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [buyProduct, setBuyProduct] = useState(null);
  const [loading, setLoading] = useState(isBuyNow);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isBuyNow) return undefined;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data = await api(`/products/${buyNowId}`);
        if (active) setBuyProduct(data.product);
      } catch (error) {
        if (active) setLoadError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isBuyNow, buyNowId]);

  const items = isBuyNow
    ? buyProduct
      ? [
          {
            productId: buyProduct.id,
            name: buyProduct.name,
            price: buyProduct.price,
            originalPrice: buyProduct.originalPrice,
            quantity: buyNowQty,
            image: buyProduct.image,
            category: buyProduct.category,
            stock: buyProduct.stock,
          },
        ]
      : []
    : cart.activeItems;

  const totals = computeTotals(items);

  function validate() {
    const next = {};
    if (!form.customerName.trim()) next.customerName = 'Name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) next.phone = 'Enter a valid 10-digit phone number';
    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = 'Enter a valid 6-digit pincode';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (isBuyNow) {
        payload.items = [{ productId: buyProduct.id, quantity: buyNowQty }];
      }
      const data = await api('/orders', { method: 'POST', body: payload });
      if (!isBuyNow) await cart.refresh();
      toast.success(`Order #${data.order.id} placed successfully`);
      navigate(`/payment?orderId=${data.order.id}`, { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Preparing your order..." />;

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={loadError} />
        <div className="mt-6 text-center">
          <Link to="/products" className="btn-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={<MapPin className="h-7 w-7" />}
          title={isBuyNow ? 'This product is not available' : 'Your cart is empty'}
          message={
            isBuyNow
              ? 'The product you tried to buy could not be found.'
              : 'Add products to your cart before checking out.'
          }
          actionLabel="Browse products"
          actionTo="/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
          Step 1 of 2 - Details
        </p>
        <h1 className="section-title mt-1">Checkout</h1>
      </div>

      {isBuyNow && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-lavender-200 bg-lavender-50 px-4 py-3 text-sm font-semibold text-lavender-800">
          <Zap className="h-4 w-4" /> Buy Now order - your cart stays untouched.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Customer details */}
        <form onSubmit={submit} noValidate className="card p-6 lg:col-span-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <MapPin className="h-5 w-5 text-lavender-600" /> Delivery details
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="customerName">
                Full name *
              </label>
              <input
                id="customerName"
                className="input"
                placeholder="Recipient name"
                value={form.customerName}
                onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              />
              {errors.customerName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="phone">
                Phone number *
              </label>
              <input
                id="phone"
                className="input"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="city">
                City *
              </label>
              <input
                id="city"
                className="input"
                placeholder="City"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
              {errors.city && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.city}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">
                Address *
              </label>
              <textarea
                id="address"
                rows={3}
                className="input resize-none"
                placeholder="Flat / house no., street, area"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
              {errors.address && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="pincode">
                Pincode *
              </label>
              <input
                id="pincode"
                className="input"
                inputMode="numeric"
                placeholder="6-digit pincode"
                value={form.pincode}
                onChange={(event) => setForm({ ...form, pincode: event.target.value })}
              />
              {errors.pincode && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.pincode}</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full py-3" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Continue to Payment'}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-navy-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Your details are only used for
            this demo order.
          </p>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-5">
            <h2 className="text-lg font-bold text-navy-900">Order summary</h2>

            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <ProductImage
                    product={item}
                    className="h-12 w-12 shrink-0 rounded-lg"
                    emojiClass="text-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-navy-900">{item.name}</p>
                    <p className="text-xs text-navy-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-navy-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-navy-600">
                <dt>Item total (MRP)</dt>
                <dd>{formatCurrency(totals.gross)}</dd>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <dt>Discount</dt>
                <dd>− {formatCurrency(totals.discount)}</dd>
              </div>
              <div className="flex justify-between text-navy-600">
                <dt>Delivery charge</dt>
                <dd>{totals.delivery === 0 ? 'FREE' : formatCurrency(totals.delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold text-navy-900">
                <dt>Payable total</dt>
                <dd>{formatCurrency(totals.total)}</dd>
              </div>
            </dl>

            {!isBuyNow && (
              <Link to="/cart" className="btn-outline mt-4 w-full">
                Edit cart
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

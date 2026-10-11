import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Bookmark, ShoppingCart, ArrowRight, BookmarkX } from 'lucide-react';
import ProductImage from '../components/ProductImage';
import QuantityStepper from '../components/QuantityStepper';
import { Spinner, EmptyState } from '../components/States';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, computeTotals } from '../lib/format';

function CartRow({ item, onQuantity, onRemove, onSave, saveMode }) {
  const [busy, setBusy] = useState(false);
  const atMax = item.quantity >= item.stock;

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      // handled by caller via toast
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center">
      <Link to={`/product/${item.productId}`} className="shrink-0">
        <ProductImage product={item} className="h-20 w-20 rounded-xl" emojiClass="text-3xl" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/product/${item.productId}`}
          className="line-clamp-1 font-bold text-navy-900 hover:text-navy-700"
        >
          {item.name}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-lavender-700">
          {item.category}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-extrabold text-navy-900">{formatCurrency(item.price)}</span>
          {item.originalPrice > item.price && (
            <span className="text-xs text-navy-400 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
          {item.stock < 10 && (
            <span className="chip bg-amber-50 text-amber-700">Only {item.stock} left</span>
          )}
        </div>
        {item.stock === 0 && (
          <p className="mt-1 text-xs font-semibold text-rose-600">
            Out of stock - remove this item to continue
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {!saveMode && (
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={Math.max(item.stock, 1)}
            disabled={busy}
            onChange={(next) => {
              if (next < 1) return;
              onQuantity(item, next);
            }}
          />
        )}
        <div className="text-right">
          <p className="text-sm font-extrabold text-navy-900">
            {formatCurrency(item.price * item.quantity)}
          </p>
          {atMax && !saveMode && (
            <p className="text-[11px] font-medium text-amber-700">Max stock reached</p>
          )}
        </div>
        <div className="flex gap-1.5">
          {saveMode ? (
            <button
              type="button"
              className="btn-outline px-2.5 py-2"
              title="Move back to cart"
              disabled={busy || item.stock === 0}
              onClick={() => run(() => onSave(item))}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="btn-outline px-2.5 py-2"
              title="Save for later"
              disabled={busy || item.stock === 0}
              onClick={() => run(() => onSave(item))}
            >
              <Bookmark className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="btn-danger px-2.5 py-2"
            title="Remove item"
            disabled={busy}
            onClick={() => run(() => onRemove(item))}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const totals = computeTotals(cart.activeItems);

  async function changeQuantity(item, next) {
    if (next > item.stock) {
      toast.error(`Only ${item.stock} unit(s) of ${item.name} are in stock`);
      return;
    }
    try {
      await cart.update(item.id, { quantity: next });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function removeItem(item) {
    try {
      await cart.remove(item.id);
      toast.info(`${item.name} removed from cart`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function toggleSaved(item) {
    try {
      await cart.update(item.id, { savedForLater: !item.savedForLater });
      toast.success(
        item.savedForLater ? `${item.name} moved back to cart` : `${item.name} saved for later`
      );
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (cart.loading) return <Spinner label="Loading your cart..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
            Your basket
          </p>
          <h1 className="section-title mt-1">Shopping cart</h1>
        </div>
        <Link to="/products" className="btn-outline">
          Continue shopping
        </Link>
      </div>

      {cart.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7" />}
            title="Your cart is empty"
            message="Add some fresh products and they will show up here."
            actionLabel="Browse products"
            actionTo="/products"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-navy-50 px-4 py-3">
                <h2 className="text-sm font-bold text-navy-800">
                  Cart items ({cart.activeItems.length})
                </h2>
                <span className="text-xs font-semibold text-navy-500">
                  {cart.count} total unit(s)
                </span>
              </div>

              {cart.activeItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-navy-700">No active items</p>
                  <p className="mt-1 text-sm text-navy-500">
                    Move something from &quot;Save for later&quot; back into your cart.
                  </p>
                  <Link to="/products" className="btn-primary mt-4">
                    Browse products
                  </Link>
                </div>
              ) : (
                cart.activeItems.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onQuantity={changeQuantity}
                    onRemove={removeItem}
                    onSave={toggleSaved}
                  />
                ))
              )}
            </div>

            {/* Saved for later */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-lavender-50 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy-800">
                  <Bookmark className="h-4 w-4 text-lavender-700" /> Save for later (
                  {cart.savedItems.length})
                </h2>
              </div>
              {cart.savedItems.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="flex items-center justify-center gap-2 text-sm text-navy-500">
                    <BookmarkX className="h-4 w-4" /> Nothing saved yet. Use the bookmark icon on
                    a cart item to park it here.
                  </p>
                </div>
              ) : (
                cart.savedItems.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    saveMode
                    onQuantity={changeQuantity}
                    onRemove={removeItem}
                    onSave={toggleSaved}
                  />
                ))
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 p-5">
              <h2 className="text-lg font-bold text-navy-900">Price details</h2>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-navy-600">
                  <dt>Item total (MRP)</dt>
                  <dd>{formatCurrency(totals.gross)}</dd>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <dt>Discount</dt>
                  <dd>− {formatCurrency(totals.discount)}</dd>
                </div>
                <div className="flex justify-between text-navy-600">
                  <dt>Delivery</dt>
                  <dd>{totals.delivery === 0 ? 'FREE' : formatCurrency(totals.delivery)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold text-navy-900">
                  <dt>Total</dt>
                  <dd>{formatCurrency(totals.total)}</dd>
                </div>
              </dl>

              {totals.delivery > 0 && (
                <p className="mt-3 rounded-xl bg-lavender-50 px-3 py-2 text-xs font-medium text-lavender-800">
                  Add items worth {formatCurrency(499 - totals.itemsTotal)} more for free delivery.
                </p>
              )}

              <button
                type="button"
                className="btn-primary mt-5 w-full py-3"
                disabled={cart.activeItems.length === 0}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <Link to="/products" className="btn-outline mt-3 w-full">
                Add more items
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

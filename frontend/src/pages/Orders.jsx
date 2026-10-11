import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner, EmptyState, ErrorState } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../lib/format';

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-navy-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-extrabold text-navy-900">Order #{order.id}</span>
          <span className="text-navy-500">{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {order.items.slice(0, expanded ? order.items.length : 2).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-navy-700">
                {item.productName} <span className="text-navy-400">× {item.quantity}</span>
              </span>
              <span className="font-semibold text-navy-900">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {order.items.length > 2 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-lavender-700 hover:text-lavender-800"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                View all {order.items.length} items <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}

        {expanded && (
          <div className="mt-3 rounded-xl bg-canvas p-3 text-xs text-navy-600">
            <p className="flex items-center gap-1.5 font-semibold text-navy-800">
              <MapPin className="h-3.5 w-3.5" /> Delivery address
            </p>
            <p className="mt-1">
              {order.customerName}, {order.address}, {order.city} - {order.pincode}
            </p>
            <p className="mt-1">Phone: {order.phone}</p>
            {order.transactionId && (
              <p className="mt-1 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> {order.paymentMethod} ·{' '}
                {order.transactionId}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-xs text-navy-500">Total paid</p>
            <p className="text-lg font-extrabold text-navy-900">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/order/${order.id}`} className="btn-primary">
              <MapPin className="h-4 w-4" /> Track Order
            </Link>
            <button type="button" className="btn-outline" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide details' : 'Order details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api('/orders');
        if (active) setOrders(data.orders);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Loading your orders..." />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
            Order history
          </p>
          <h1 className="section-title mt-1">My orders</h1>
          <p className="text-sm text-navy-500">
            {orders.length} order(s) · track every delivery in real time
          </p>
        </div>
        <Link to="/products" className="btn-outline">
          Shop again
        </Link>
      </div>

      <div className="mt-6 space-y-5">
        {error ? (
          <ErrorState message={error} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-7 w-7" />}
            title="No orders yet"
            message="When you place your first order it will appear here with live tracking."
            actionLabel="Start shopping"
            actionTo="/products"
          />
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

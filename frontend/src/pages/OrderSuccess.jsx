import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PackageCheck, ArrowRight, ListOrdered, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner, ErrorState } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../lib/format';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get('orderId'));
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError('Order id is missing.');
      setLoading(false);
      return undefined;
    }
    (async () => {
      try {
        const data = await api(`/orders/${orderId}`);
        if (active) setOrder(data.order);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) return <Spinner label="Loading your order..." />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error || 'Order not found'} />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn-primary">
            My orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="card overflow-hidden text-center">
        <div className="bg-navy-950 px-6 py-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lavender-500 text-white shadow-lift">
            <PackageCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">
            Order placed successfully!
          </h1>
          <p className="mt-2 text-sm text-navy-300">
            Thank you for shopping with JayaMart. We&apos;ll start processing your order right away.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <dl className="grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">Order ID</dt>
              <dd className="mt-1 text-lg font-extrabold text-navy-900">#{order.id}</dd>
            </div>
            <div className="rounded-xl border border-line p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">Total amount</dt>
              <dd className="mt-1 text-lg font-extrabold text-navy-900">
                {formatCurrency(order.totalAmount)}
              </dd>
            </div>
            <div className="rounded-xl border border-line p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">
                Payment status
              </dt>
              <dd className="mt-2 flex items-center gap-2">
                <StatusBadge status={order.paymentStatus} />
                {order.transactionId && (
                  <span className="text-xs text-navy-500">{order.transactionId}</span>
                )}
              </dd>
            </div>
            <div className="rounded-xl border border-line p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">
                Order status
              </dt>
              <dd className="mt-2">
                <StatusBadge status={order.status} />
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-sm text-navy-500">
            Placed on {formatDate(order.createdAt)} · {order.itemCount} item(s) · Delivering to{' '}
            {order.city} {order.pincode}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Link to="/" className="btn-primary">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/orders" className="btn-outline">
              <ListOrdered className="h-4 w-4" /> View Orders
            </Link>
            <Link to={`/order/${order.id}`} className="btn-secondary">
              <MapPin className="h-4 w-4" /> Track Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

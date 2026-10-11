import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  Circle,
  MapPin,
  Package,
  CreditCard,
  ArrowLeft,
  Truck,
  Clock,
} from 'lucide-react';
import { api } from '../lib/api';
import { Spinner, ErrorState } from '../components/States';
import StatusBadge from '../components/StatusBadge';
import ProductImage from '../components/ProductImage';
import { formatCurrency, formatDate } from '../lib/format';

/** Estimated delivery copy based on the current status. */
function estimate(currentStatus, createdAt) {
  const placed = new Date(createdAt);
  const plus = (days) => new Date(placed.getTime() + days * 86400000);
  switch (currentStatus) {
    case 'PLACED':
      return `Arriving by ${formatDate(plus(4), false)}`;
    case 'CONFIRMED':
      return `Arriving by ${formatDate(plus(3), false)}`;
    case 'PACKED':
      return `Arriving by ${formatDate(plus(2), false)}`;
    case 'SHIPPED':
      return `Arriving by ${formatDate(plus(1), false)}`;
    case 'OUT_FOR_DELIVERY':
      return 'Arriving today';
    case 'DELIVERED':
      return 'Delivered - thank you!';
    default:
      return '';
  }
}

export default function OrderTracking() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const result = await api(`/orders/${id}/track`);
        if (active) setData(result);
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

  if (loading) return <Spinner label="Loading order tracking..." />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error || 'Order not found'} />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn-primary">
            Back to my orders
          </Link>
        </div>
      </div>
    );
  }

  const { order, stages, currentStatus, currentStatusLabel } = data;
  const delivered = currentStatus === 'DELIVERED';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-navy-950 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-lavender-300">
              Tracking order
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-white">#{order.id}</h1>
            <p className="mt-1 text-sm text-navy-300">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={currentStatus} className="!text-sm !px-4 !py-2" />
            <p className="mt-2 flex items-center justify-end gap-1.5 text-sm font-semibold text-lavender-300">
              <Clock className="h-4 w-4" /> {estimate(currentStatus, order.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-5">
          {/* Timeline */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-bold text-navy-900">Order status timeline</h2>
            <p className="text-sm text-navy-500">
              Current status: <span className="font-bold text-navy-800">{currentStatusLabel}</span>
            </p>

            <ol className="mt-6">
              {stages.map((stage, index) => {
                const isLast = index === stages.length - 1;
                const tone = stage.completed
                  ? 'bg-navy-700 text-white'
                  : stage.current
                    ? 'bg-lavender-600 text-white ring-4 ring-lavender-200'
                    : 'bg-white text-navy-300 border-2 border-line';
                const labelTone = stage.completed
                  ? 'text-navy-900'
                  : stage.current
                    ? 'text-lavender-800'
                    : 'text-navy-400';

                return (
                  <li key={stage.status} className="relative flex gap-4 pb-8 last:pb-0">
                    {!isLast && (
                      <span
                        className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${
                          stage.completed ? 'bg-navy-700' : 'bg-line'
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}
                    >
                      {stage.completed ? (
                        <Check className="h-5 w-5" />
                      ) : stage.current ? (
                        <span className="h-3 w-3 rounded-full bg-white" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </span>

                    <div className="pt-1.5">
                      <p className={`text-sm font-bold ${labelTone}`}>
                        {stage.label}
                        {stage.current && (
                          <span className="ml-2 rounded-full bg-lavender-100 px-2 py-0.5 text-[11px] font-bold text-lavender-700">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-400">
                        {stage.at
                          ? formatDate(stage.at)
                          : stage.completed
                            ? 'Completed'
                            : stage.current
                              ? 'In progress'
                              : 'Pending'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {!delivered && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-lavender-200 bg-lavender-50 p-4 text-sm text-lavender-800">
                <Truck className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  The seller updates this status in real time from the JayaMart seller dashboard.
                  Refresh to see the latest progress.
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-line p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
                <Package className="h-4 w-4 text-lavender-600" /> Items ({order.itemCount})
              </h3>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <ProductImage
                      product={item}
                      className="h-11 w-11 shrink-0 rounded-lg"
                      emojiClass="text-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-navy-800">
                        {item.productName}
                      </p>
                      <p className="text-xs text-navy-500">
                        Qty {item.quantity} · {formatCurrency(item.price)} each
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-navy-600">Total</span>
                <span className="text-lg font-extrabold text-navy-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-line p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
                <CreditCard className="h-4 w-4 text-lavender-600" /> Payment
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={order.paymentStatus} />
                {order.transactionId && (
                  <span className="text-xs text-navy-500">{order.transactionId}</span>
                )}
              </div>
              {order.bank && (
                <p className="mt-2 text-xs text-navy-500">
                  {order.paymentMethod} via {order.bank}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-line p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
                <MapPin className="h-4 w-4 text-lavender-600" /> Delivery address
              </h3>
              <p className="mt-2 text-sm text-navy-600">
                {order.customerName}
                <br />
                {order.address}
                <br />
                {order.city} - {order.pincode}
              </p>
              <p className="mt-1 text-sm text-navy-500">Phone: {order.phone}</p>
            </div>

            <Link to="/orders" className="btn-outline w-full">
              View all orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

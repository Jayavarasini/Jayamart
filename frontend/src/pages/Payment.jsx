import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Landmark, ShieldCheck, LockKeyhole, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { DEMO_BANKS } from '../lib/constants';
import { Spinner, ErrorState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../lib/format';

const BANK_META = {
  SBI: { initial: 'S', tone: 'bg-navy-700 text-white' },
  'HDFC Bank': { initial: 'H', tone: 'bg-sky-700 text-white' },
  'ICICI Bank': { initial: 'I', tone: 'bg-lavender-600 text-white' },
  'Axis Bank': { initial: 'A', tone: 'bg-indigo-700 text-white' },
};

export default function Payment() {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get('orderId'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bank, setBank] = useState('');
  const [accountName, setAccountName] = useState(user?.name || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError('Missing order id. Please place an order first.');
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

  async function handlePay(event) {
    event.preventDefault();
    const next = {};
    if (!bank) next.bank = 'Please select your bank';
    if (!accountName.trim()) next.accountName = 'Account holder name is required';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setPaying(true);
    try {
      // Simulate a short gateway round-trip - demo payment only.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const data = await api('/payments', {
        method: 'POST',
        body: {
          orderId,
          paymentMethod: 'NET_BANKING',
          bank,
          accountName: accountName.trim(),
        },
      });
      toast.success(`Payment successful - ${data.payment.transactionId}`);
      navigate(`/order-success?orderId=${orderId}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setPaying(false);
    }
  }

  if (loading) return <Spinner label="Loading payment details..." />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error || 'Order not found'} />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn-primary">
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  const alreadyPaid = order.paymentStatus === 'PAID';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
          Step 2 of 2 - Payment
        </p>
        <h1 className="section-title mt-1">Pay for order #{order.id}</h1>
        <p className="mt-1 text-sm text-navy-500">Placed on {formatDate(order.createdAt)}</p>
      </div>

      {alreadyPaid ? (
        <div className="card mt-6 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-bold text-navy-900">This order is already paid</h2>
          <p className="mt-2 text-sm text-navy-500">
            Transaction {order.transactionId} - {formatCurrency(order.totalAmount)}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/order-success?orderId=${order.id}`} className="btn-primary">
              View order summary
            </Link>
            <Link to={`/order/${order.id}`} className="btn-outline">
              Track order
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Payment form */}
          <form onSubmit={handlePay} className="card p-6 lg:col-span-3" noValidate>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-lavender-100 text-lavender-700">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-navy-900">Demo Net Banking</h2>
                <p className="text-xs text-navy-500">
                  No real money moves - this is a simulated payment gateway.
                </p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="label">Select your bank *</legend>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_BANKS.map((name) => {
                  const meta = BANK_META[name];
                  const active = bank === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setBank(name)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? 'border-navy-700 bg-navy-50 ring-2 ring-lavender-200'
                          : 'border-line bg-white hover:border-navy-300'
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${meta.tone}`}
                      >
                        {meta.initial}
                      </span>
                      <span className="text-sm font-bold text-navy-800">{name}</span>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.bank && (
                <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.bank}</p>
              )}
            </fieldset>

            <div className="mt-5">
              <label className="label" htmlFor="accountName">
                Account / customer name *
              </label>
              <input
                id="accountName"
                className="input"
                placeholder="Name on the bank account"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
              />
              {fieldErrors.accountName && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {fieldErrors.accountName}
                </p>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-lavender-300 bg-lavender-50 p-4 text-xs text-navy-600">
              <p className="font-bold text-navy-800">Demo mode</p>
              <p className="mt-1">
                Clicking &quot;Pay Now&quot; simulates a successful net banking payment and
                records a realistic transaction ID against order #{order.id}.
              </p>
            </div>

            <button type="submit" className="btn-primary mt-5 w-full py-3" disabled={paying}>
              {paying ? (
                <>
                  <LockKeyhole className="h-4 w-4" /> Processing payment...
                </>
              ) : (
                <>Pay {formatCurrency(order.totalAmount)}</>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(isCheckoutAvailable() ? -1 : '/orders')}
              className="btn-outline mt-3 w-full"
              disabled={paying}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </form>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="card sticky top-24 p-5">
              <h2 className="text-lg font-bold text-navy-900">Paying for</h2>
              <ul className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-navy-700">
                      {item.productName}{' '}
                      <span className="text-navy-400">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-navy-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm font-semibold text-navy-600">Total payable</span>
                <span className="text-xl font-extrabold text-navy-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                <ShieldCheck className="mr-1 inline h-4 w-4" />
                100% secure demo checkout - no card or bank details are stored.
              </div>

              <div className="mt-4 text-xs text-navy-500">
                Delivering to: {order.customerName}, {order.address}, {order.city} -{' '}
                {order.pincode}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isCheckoutAvailable() {
  return typeof window !== 'undefined' && window.history.length > 1;
}

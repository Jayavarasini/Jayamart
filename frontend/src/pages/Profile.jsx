import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, CalendarDays, ShoppingBag, Package, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">Account</p>
        <h1 className="section-title mt-1">My profile</h1>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-navy-950 px-6 py-6">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-lavender-500 text-xl font-extrabold text-white">
            {initials}
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-white">{user.name}</h2>
            <p className="text-sm text-navy-300">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-lavender-300">
              {user.role === 'SELLER' ? 'Seller account' : 'Buyer account'}
            </span>
          </div>
        </div>

        <dl className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-xl border border-line p-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400">
              <User className="h-4 w-4" /> Name
            </dt>
            <dd className="mt-1 text-sm font-bold text-navy-900">{user.name}</dd>
          </div>
          <div className="rounded-xl border border-line p-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400">
              <Mail className="h-4 w-4" /> Email
            </dt>
            <dd className="mt-1 break-all text-sm font-bold text-navy-900">{user.email}</dd>
          </div>
          <div className="rounded-xl border border-line p-4">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400">
              <CalendarDays className="h-4 w-4" /> Member since
            </dt>
            <dd className="mt-1 text-sm font-bold text-navy-900">
              {formatDate(user.createdAt, false)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3 border-t border-line p-6">
          <Link to="/orders" className="btn-primary">
            <Package className="h-4 w-4" /> My Orders
          </Link>
          <Link to="/cart" className="btn-outline">
            <ShoppingBag className="h-4 w-4" /> My Cart
          </Link>
          {user.role === 'SELLER' && (
            <Link to="/seller" className="btn-secondary">
              <LayoutDashboard className="h-4 w-4" /> Seller Dashboard
            </Link>
          )}
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              logout();
              toast.info('You have been logged out');
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

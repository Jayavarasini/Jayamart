import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  ChevronDown,
  LogOut,
  Package,
  User as UserIcon,
  Menu,
  X,
  Store,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CATEGORIES, CATEGORY_META } from '../lib/constants';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="JayaMart home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-700 text-lg font-extrabold text-white shadow-sm">
        J
      </span>
      <span className="text-xl font-extrabold tracking-tight text-navy-900">
        Jaya<span className="text-lavender-600">Mart</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // 'categories' | 'user' | 'mobile'

  // Keep the search box in sync with ?search= on the products page.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === '/products') {
      setQuery(params.get('search') || '');
    }
  }, [location.pathname, location.search]);

  // Close floating menus whenever the route changes.
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/products?search=${encodeURIComponent(value)}` : '/products');
    setOpenMenu(null);
  }

  function goCategory(category) {
    navigate(`/products?category=${encodeURIComponent(category)}`);
    setOpenMenu(null);
  }

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-lavender-100 text-navy-900' : 'text-navy-700 hover:bg-navy-50'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search for rice, perfume, chips..."
            className="input pl-9"
            aria-label="Search products"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'categories' ? null : 'categories')}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
            >
              Categories
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <NavLink to="/products" className={navLinkClass}>
            Products
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-3">
          {/* Cart */}
          <Link
            to="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-navy-700 transition hover:border-navy-300 hover:bg-navy-50"
            aria-label={`Cart with ${count} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-lavender-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'user' ? null : 'user')}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy-800 transition hover:border-navy-300"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-lavender-100 text-xs font-bold text-lavender-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[7rem] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 text-navy-400" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn-outline">
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'mobile' ? null : 'mobile')}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-navy-700 md:hidden"
            aria-label="Toggle menu"
          >
            {openMenu === 'mobile' ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Click-away layer for desktop dropdowns */}
      {openMenu && openMenu !== 'mobile' && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setOpenMenu(null)}
        />
      )}

      {/* Categories dropdown */}
      {openMenu === 'categories' && (
        <div className="absolute left-1/2 top-16 z-50 hidden w-64 -translate-x-1/2 rounded-2xl border border-line bg-white p-2 shadow-lift md:block">
          {CATEGORIES.filter((category) => category !== 'All').map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => goCategory(category)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-navy-800 transition hover:bg-lavender-50"
            >
              <span className="text-lg">{CATEGORY_META[category]?.emoji}</span>
              {category}
            </button>
          ))}
        </div>
      )}

      {/* User dropdown */}
      {openMenu === 'user' && user && (
        <div className="absolute right-6 top-16 z-50 hidden w-64 rounded-2xl border border-line bg-white p-2 shadow-lift md:block">
          <div className="border-b border-line px-3 py-3">
            <p className="truncate text-sm font-bold text-navy-900">{user.name}</p>
            <p className="truncate text-xs text-navy-500">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-lavender-100 px-2 py-0.5 text-[11px] font-bold text-lavender-700">
              {user.role === 'SELLER' ? 'Seller account' : 'Buyer account'}
            </span>
          </div>
          <Link
            to="/orders"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-lavender-50"
          >
            <Package className="h-4 w-4" /> My Orders
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-lavender-50"
          >
            <UserIcon className="h-4 w-4" /> Profile
          </Link>
          {user.role === 'SELLER' && (
            <Link
              to="/seller"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-lavender-50"
            >
              <LayoutDashboard className="h-4 w-4" /> Seller Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}

      {/* Mobile panel */}
      {openMenu === 'mobile' && (
        <div className="border-t border-line bg-white px-4 py-4 md:hidden">
          <form onSubmit={submitSearch} className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search products..."
              className="input pl-9"
              aria-label="Search products"
            />
          </form>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/" className="btn-outline justify-start">
              Home
            </Link>
            <Link to="/products" className="btn-outline justify-start">
              Products
            </Link>
            <Link to="/orders" className="btn-outline justify-start">
              My Orders
            </Link>
            <Link to="/profile" className="btn-outline justify-start">
              Profile
            </Link>
          </div>

          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-navy-400">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((category) => category !== 'All').map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => goCategory(category)}
                className="chip border border-line bg-white text-navy-700 hover:border-navy-300"
              >
                <span>{CATEGORY_META[category]?.emoji}</span>
                {category}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <div className="rounded-xl bg-lavender-50 px-3 py-2 text-sm font-semibold text-navy-800">
                  Signed in as {user.name} ({user.role === 'SELLER' ? 'Seller' : 'Buyer'})
                </div>
                {user.role === 'SELLER' && (
                  <Link to="/seller" className="btn-secondary">
                    <Store className="h-4 w-4" /> Seller Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="btn-danger"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn-outline">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShoppingBasket } from 'lucide-react';
import { CATEGORIES, CATEGORY_META } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="mt-16 bg-navy-950 text-navy-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-lavender-500 text-lg font-extrabold text-white">
              J
            </span>
            <span className="text-xl font-extrabold text-white">
              Jaya<span className="text-lavender-400">Mart</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-navy-300">
            Find it. Love it. Buy it. Your friendly online supermarket for everyday shopping.
          </p>
          <div className="mt-4 space-y-2 text-sm text-navy-300">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-lavender-400" /> support@jayamart.com
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-lavender-400" /> +91 98765 43210
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-lavender-400" /> Bengaluru, India
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.filter((category) => category !== 'All').map((category) => (
              <li key={category}>
                <Link
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="text-navy-300 transition hover:text-lavender-300"
                >
                  {CATEGORY_META[category]?.emoji} {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Your account</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/products" className="text-navy-300 transition hover:text-lavender-300">
                Browse products
              </Link>
            </li>
            <li>
              <Link to="/cart" className="text-navy-300 transition hover:text-lavender-300">
                Shopping cart
              </Link>
            </li>
            <li>
              <Link to="/orders" className="text-navy-300 transition hover:text-lavender-300">
                Order history &amp; tracking
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-navy-300 transition hover:text-lavender-300">
                Profile
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-navy-300 transition hover:text-lavender-300">
                Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Why JayaMart</p>
          <ul className="mt-3 space-y-3 text-sm text-navy-300">
            <li className="flex items-start gap-2">
              <ShoppingBasket className="mt-0.5 h-4 w-4 shrink-0 text-lavender-400" />
              7 categories, dozens of everyday products
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-lavender-400">₹</span>
              Honest prices with visible discounts on every card
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-lavender-400">✓</span>
              Live order tracking from Placed to Delivered
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-navy-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} JayaMart. Built as an academic e-commerce project.</p>
          <p>Demo payments only - no real money is processed.</p>
        </div>
      </div>
    </footer>
  );
}

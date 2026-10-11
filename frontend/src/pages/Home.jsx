import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBasket,
  Truck,
  BadgePercent,
  Headphones,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, CATEGORY_META } from '../lib/constants';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/States';
import { formatCurrency } from '../lib/format';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api('/products');
        if (active) setProducts(data.products);
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

  const offers = products
    .filter((product) => product.discountPercentage > 0)
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, 4);

  const popular = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const categoryCount = CATEGORIES.filter((c) => c !== 'All').length;

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-navy-950">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lavender-600/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-lavender-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="chip bg-lavender-500/20 text-lavender-300">
              <span className="h-1.5 w-1.5 rounded-full bg-lavender-400" /> JayaMart Online
              Supermarket
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Find it.
              <br />
              Love it.
              <span className="text-lavender-400"> Buy it.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-navy-300 lg:mx-0">
              Groceries, beverages, snacks, stationery and more - hundreds of everyday products
              from {categoryCount} categories, with live discounts and door-step delivery.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link to="/products" className="btn bg-lavender-500 px-6 py-3 text-base text-white hover:bg-lavender-600">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#categories" className="btn border border-navy-700 px-6 py-3 text-base text-white hover:bg-navy-900">
                Browse Categories
              </a>
            </div>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-left text-xs text-navy-300">
              <div className="rounded-xl bg-white/5 p-3">
                <Truck className="h-4 w-4 text-lavender-400" />
                <p className="mt-1.5 font-semibold text-white">Free delivery over ₹499</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <BadgePercent className="h-4 w-4 text-lavender-400" />
                <p className="mt-1.5 font-semibold text-white">Live discounts</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <Headphones className="h-4 w-4 text-lavender-400" />
                <p className="mt-1.5 font-semibold text-white">Order tracking</p>
              </div>
            </div>
          </div>

          {/* Hero visual - floating category tiles */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-3 gap-4">
              {CATEGORIES.filter((category) => category !== 'All')
                .slice(0, 6)
                .map((category, index) => (
                  <Link
                    key={category}
                    to={`/products?category=${encodeURIComponent(category)}`}
                    className={`card flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-1 hover:shadow-lift ${
                      index % 2 === 1 ? 'translate-y-6' : ''
                    }`}
                  >
                    <span className="text-4xl">{CATEGORY_META[category]?.emoji}</span>
                    <span className="text-sm font-bold text-navy-800">{category}</span>
                  </Link>
                ))}
            </div>
            <div className="absolute -bottom-6 -right-2 flex items-center gap-3 rounded-2xl border border-lavender-300 bg-white px-4 py-3 shadow-lift">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-lavender-100 text-lavender-700">
                <Zap className="h-5 w-5" />
              </span>
              <div className="text-sm">
                <p className="font-bold text-navy-900">Delivered in 30 minutes</p>
                <p className="text-navy-500">across selected areas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
              Shop by category
            </p>
            <h2 className="section-title mt-1">Everything you need, in one place</h2>
          </div>
          <Link to="/products" className="hidden text-sm font-semibold text-navy-600 hover:text-navy-900 sm:inline-flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {CATEGORIES.filter((category) => category !== 'All').map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="card group flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-1 hover:border-lavender-300 hover:shadow-lift"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${
                  CATEGORY_META[category]?.gradient
                } text-2xl shadow-sm transition group-hover:scale-110`}
              >
                {CATEGORY_META[category]?.emoji}
              </span>
              <span className="text-sm font-bold text-navy-800">{category}</span>
              <span className="text-[11px] text-navy-400">Explore</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Offers ---------- */}
      <section className="bg-lavender-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
                Today&apos;s offers
              </p>
              <h2 className="section-title mt-1">Save on your weekly shop</h2>
            </div>
            <Link
              to="/products"
              className="hidden items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-900 sm:inline-flex"
            >
              See all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-6">
              <ProductGridSkeleton count={4} />
            </div>
          ) : offers.length === 0 ? (
            <p className="mt-6 text-sm text-navy-500">No offers available right now - check back soon!</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {offers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Popular products ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
              Popular right now
            </p>
            <h2 className="section-title mt-1">Fresh picks for you</h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-900 sm:inline-flex"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6">
            <ProductGridSkeleton count={8} />
          </div>
        ) : error ? (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/products" className="btn-primary px-6 py-3">
            <ShoppingBasket className="h-4 w-4" /> Explore the full store
          </Link>
        </div>
      </section>

      {/* ---------- Why JayaMart ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <ShoppingBasket className="h-5 w-5" />,
              title: 'Curated everyday range',
              text: 'Grocery, fragrance, juice, ice cream, snacks, stationery and makeup - all carefully stocked.',
            },
            {
              icon: <BadgePercent className="h-5 w-5" />,
              title: 'Transparent pricing',
              text: 'Every card shows the original price, your price and exactly how much you save.',
            },
            {
              icon: <Truck className="h-5 w-5" />,
              title: 'Track every order',
              text: 'Follow your order from Placed to Delivered with a live status timeline.',
            },
          ].map((feature) => (
            <div key={feature.title} className="card flex items-start gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-700 text-white">
                {feature.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-navy-900">{feature.title}</h3>
                <p className="mt-1 text-sm leading-6 text-navy-500">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

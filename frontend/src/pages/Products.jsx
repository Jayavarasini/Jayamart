import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, CATEGORY_META } from '../lib/constants';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/States';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';

  const [draft, setDraft] = useState(search);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(search);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'All') params.set('category', category);

    (async () => {
      try {
        const data = await api(`/products?${params.toString()}`);
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
  }, [search, category]);

  function updateParams(next) {
    const merged = { search, category, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set('search', merged.search);
    if (merged.category && merged.category !== 'All') params.set('category', merged.category);
    setSearchParams(params);
  }

  function submitSearch(event) {
    event.preventDefault();
    updateParams({ search: draft.trim() });
  }

  function clearFilters() {
    setDraft('');
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold uppercase tracking-wide text-lavender-700">
          JayaMart store
        </p>
        <h1 className="section-title">Browse products</h1>
        <p className="text-sm text-navy-500">
          {loading ? 'Finding products...' : `${products.length} product(s) found`}
          {search && (
            <span>
              {' '}
              for &quot;<span className="font-semibold text-navy-800">{search}</span>&quot;
            </span>
          )}
          {category !== 'All' && (
            <span>
              {' '}
              in <span className="font-semibold text-navy-800">{category}</span>
            </span>
          )}
        </p>
      </div>

      {/* Search + filters */}
      <div className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-card">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              type="search"
              placeholder="Search by name, category or description..."
              className="input pl-9"
              aria-label="Search products"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          {(search || category !== 'All') && (
            <button type="button" onClick={clearFilters} className="btn-outline" title="Clear filters">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="hidden shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide text-navy-400 sm:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Category
          </span>
          {CATEGORIES.map((item) => {
            const active = category === item || (item === 'All' && category === 'All');
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateParams({ category: item === 'All' ? '' : item })}
                className={`chip shrink-0 border transition ${
                  active
                    ? 'border-navy-700 bg-navy-700 text-white'
                    : 'border-line bg-white text-navy-700 hover:border-navy-300'
                }`}
              >
                {item !== 'All' && <span>{CATEGORY_META[item]?.emoji}</span>}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => updateParams({})} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message={
              search || category !== 'All'
                ? 'Try a different keyword or clear the filters to see everything JayaMart offers.'
                : 'The catalogue is empty right now. Please check back soon.'
            }
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {!loading && products.length > 0 && (
        <div className="mt-8 text-center">
          <Link to="/" className="btn-outline">
            Back to home
          </Link>
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Loader2, PackageOpen } from 'lucide-react';

/** Full-page / inline loading spinner. */
export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-navy-500">
      <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/** Card-shaped loading skeleton for product grids. */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="aspect-square w-full animate-pulse bg-navy-50" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-navy-50" />
            <div className="h-4 w-full animate-pulse rounded bg-navy-50" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-navy-50" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-navy-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Friendly empty state with a call to action. */
export function EmptyState({ icon, title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lavender-100 text-lavender-700">
        {icon || <PackageOpen className="h-7 w-7" />}
      </div>
      <h2 className="mt-4 text-lg font-bold text-navy-900">{title}</h2>
      {message && <p className="mt-2 text-sm text-navy-500">{message}</p>}
      {(actionTo || onAction) && (
        <div className="mt-5">
          {actionTo ? (
            <Link to={actionTo} className="btn-primary">
              {actionLabel}
            </Link>
          ) : (
            <button type="button" onClick={onAction} className="btn-primary">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Simple centred error card. */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="card mx-auto max-w-lg border-rose-200 p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-xl">
        ⚠️
      </div>
      <h2 className="mt-4 text-lg font-bold text-navy-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-navy-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-5">
          Try again
        </button>
      )}
    </div>
  );
}

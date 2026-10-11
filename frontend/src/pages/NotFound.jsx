import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="card p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lavender-100 text-lavender-700">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-5 text-5xl font-extrabold text-navy-900">404</p>
        <h1 className="mt-2 text-xl font-bold text-navy-900">Page not found</h1>
        <p className="mt-2 text-sm text-navy-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/products" className="btn-outline">
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Blocks access to buyer routes until the user is logged in. */
export default function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="card p-8">
          <ShieldAlert className="mx-auto h-10 w-10 text-lavender-600" />
          <h1 className="mt-4 text-xl font-bold text-navy-900">Login required</h1>
          <p className="mt-2 text-sm text-navy-500">
            Please log in to your JayaMart account to continue.
          </p>
          <Link
            to="/login"
            state={{ from: location.pathname + location.search }}
            className="btn-primary mt-5 w-full"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

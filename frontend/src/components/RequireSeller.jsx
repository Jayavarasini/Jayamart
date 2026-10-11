import { Link } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Blocks seller routes: buyers get a 403-style Forbidden screen. */
export default function RequireSeller({ children }) {
  const { user, initializing } = useAuth();

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
          <h1 className="mt-4 text-xl font-bold text-navy-900">Seller login required</h1>
          <p className="mt-2 text-sm text-navy-500">Please log in with a seller account.</p>
          <Link to="/login" className="btn-primary mt-5 w-full">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'SELLER') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="card border-rose-200 p-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-2xl">
            403
          </div>
          <h1 className="mt-4 text-xl font-bold text-navy-900">Forbidden</h1>
          <p className="mt-2 text-sm text-navy-500">
            Your account does not have permission to access the JayaMart seller dashboard.
          </p>
          <div className="mt-5 flex gap-2">
            <Link to="/" className="btn-outline flex-1">
              Go Home
            </Link>
            <Link to="/orders" className="btn-primary flex-1">
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

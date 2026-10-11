import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setServerError('');
    try {
      const user = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(`Welcome to JayaMart, ${user.name}!`);
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
      <div className="relative hidden overflow-hidden rounded-3xl bg-navy-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-lavender-600/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-lavender-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lavender-500 text-lg font-extrabold text-white">
              J
            </span>
            <span className="text-2xl font-extrabold">
              Jaya<span className="text-lavender-400">Mart</span>
            </span>
          </div>
          <h2 className="mt-8 text-3xl font-extrabold leading-snug">
            Create your free
            <br />
            JayaMart account
          </h2>
        </div>
        <ul className="relative space-y-3 text-sm text-navy-200">
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-lavender-300">
              ✓
            </span>
            Faster checkout with saved details
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-lavender-300">
              ✓
            </span>
            Save products for later
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-lavender-300">
              ✓
            </span>
            Real-time order tracking
          </li>
        </ul>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-lavender-100 text-lavender-700">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Create account</h1>
            <p className="text-sm text-navy-500">Join JayaMart in a few seconds</p>
          </div>
        </div>

        {serverError && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {serverError}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="input pl-9"
                placeholder="Your name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs font-medium text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input pl-9"
                placeholder="you@example.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-9 pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="confirm">
                Confirm password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-9"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                />
              </div>
              {errors.confirm && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.confirm}</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-navy-700 hover:text-lavender-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

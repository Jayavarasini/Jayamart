import { X, AlertTriangle } from 'lucide-react';

/** Reusable confirmation dialog (delete product, destructive actions, ...). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-fade-up rounded-2xl border border-line bg-white p-6 shadow-lift">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            danger ? 'bg-rose-50 text-rose-600' : 'bg-lavender-100 text-lavender-700'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-navy-900">{title}</h3>
        <p className="mt-2 text-sm text-navy-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-outline flex-1" disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? 'btn flex-1 bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary flex-1'}
            disabled={busy}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

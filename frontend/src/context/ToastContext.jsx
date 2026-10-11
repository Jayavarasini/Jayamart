import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'success') => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const toast = {
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
    info: (message) => push(message, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`animate-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lift ${
              item.type === 'error'
                ? 'border-rose-200 text-rose-700'
                : item.type === 'info'
                  ? 'border-lavender-200 text-navy-800'
                  : 'border-emerald-200 text-emerald-700'
            }`}
          >
            <span className="mt-0.5 text-base leading-none">
              {item.type === 'error' ? '⚠️' : item.type === 'info' ? 'ℹ️' : '✓'}
            </span>
            <span className="flex-1 font-medium">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

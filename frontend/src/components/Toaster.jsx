import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  error: { icon: XCircle, classes: 'border-red-200 bg-red-50 text-red-900' },
  info: { icon: Info, classes: 'border-brand-border bg-brand-light text-brand' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'success', duration = 4500) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, message, type }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast,
      success: (msg) => toast(msg, 'success'),
      error: (msg) => toast(msg, 'error'),
      info: (msg) => toast(msg, 'info'),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:top-24"
      >
        {toasts.map(({ id, message, type }) => {
          const { icon: Icon, classes } = STYLES[type] ?? STYLES.info;
          return (
            <div
              key={id}
              role="status"
              className={`animate-fade-up pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card ${classes}`}
            >
              <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss notification"
                className="rounded p-1 opacity-60 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

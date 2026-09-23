import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent<Omit<ToastItem, 'id'>>;
      if (!customEvent.detail || !customEvent.detail.message) return;

      const newToast: ToastItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'info',
        duration: customEvent.detail.duration || 4000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Automatically remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration);
    };

    window.addEventListener('show-app-toast', handleShowToast);
    return () => {
      window.removeEventListener('show-app-toast', handleShowToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-16 sm:bottom-20 right-4 z-[9999] max-w-sm w-full space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 shadow-2xl backdrop-blur-md pointer-events-auto ${
                isError
                  ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
                  : isSuccess
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900/95 border-slate-700/50 text-slate-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {!isError && !isSuccess && <Info className="w-4 h-4 text-indigo-400" />}
              </div>

              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-white transition p-0.5 rounded-md hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Global trigger helpers for safe clean imports across any file
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('show-app-toast', {
      detail: { message, type, duration },
    })
  );
}

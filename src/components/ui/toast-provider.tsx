'use client';

import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  description?: string;
}

interface ToastContextType {
  toast: (message: string, options?: { type?: ToastType; description?: string; duration?: number }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  loading: (message: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, options?: { type?: ToastType; description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const type = options?.type || 'info';
    const description = options?.description;
    const duration = options?.duration || (type === 'loading' ? Infinity : 5000);

    setToasts((prev) => [...prev, { id, message, type, description }]);

    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }, [dismiss]);

  const success = (message: string, description?: string) => toast(message, { type: 'success', description });
  const error = (message: string, description?: string) => toast(message, { type: 'error', description });
  const info = (message: string, description?: string) => toast(message, { type: 'info', description });
  const loading = (message: string, description?: string) => toast(message, { type: 'loading', description });

  return (
    <ToastContext.Provider value={{ toast, success, error, info, loading, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[400px]">
        <AnimatePresence mode="multiple">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "pointer-events-auto w-full bg-background border rounded-xl shadow-2xl p-4 flex gap-4 items-start relative overflow-hidden group",
                t.type === 'success' && "border-green-500/20 bg-green-50/50 dark:bg-green-950/20",
                t.type === 'error' && "border-red-500/20 bg-red-50/50 dark:bg-red-950/20",
                t.type === 'info' && "border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20",
                t.type === 'loading' && "border-primary/20 bg-primary/5 shadow-primary/10"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                {t.type === 'loading' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground leading-tight">{t.message}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-1 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              {t.type !== 'loading' && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className={cn(
                    "absolute bottom-0 left-0 h-1 bg-current opacity-20",
                    t.type === 'success' && "text-green-600",
                    t.type === 'error' && "text-red-600",
                    t.type === 'info' && "text-blue-600"
                  )}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

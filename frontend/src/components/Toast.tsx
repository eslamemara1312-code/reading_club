import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (text: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (text, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, text }] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => removeToast(toast.id)}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl glass-panel shadow-2xl border text-xs font-semibold backdrop-blur-xl cursor-pointer ${
                toast.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                  : toast.type === 'error'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-rose-500/10'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-slate-900/50'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 leading-snug">{toast.text}</span>
              <X className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity shrink-0" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}


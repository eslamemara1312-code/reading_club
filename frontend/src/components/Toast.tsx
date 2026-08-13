import { create } from 'zustand';
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
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`rc-toast-enter pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-xl cursor-pointer ${
              toast.type === 'success'
                ? 'bg-reader-panel text-reader-metric-limeText border-reader-borderStrong shadow-lg'
                : toast.type === 'error'
                ? 'bg-reader-panel text-red-400 border-red-500/30 shadow-lg'
                : 'bg-reader-panel text-reader-text border-reader-border shadow-lg'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1 leading-snug">{toast.text}</span>
            <X className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

export function showToast(text: string, type: ToastType = 'info') {
  useToastStore.getState().addToast(text, type);
}

import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[var(--status-positive)] shrink-0" />,
    error: <XCircle className="w-4 h-4 text-[var(--status-negative)] shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-[var(--status-warning)] shrink-0" />,
    info: <Info className="w-4 h-4 text-[var(--status-info)] shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-elevated border backdrop-blur-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2',
            'bg-[var(--bg-surface)]/95 border-[var(--border-subtle)]'
          )}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#71806C] dark:text-[#899783] shrink-0" />,
    error: <XCircle className="w-4 h-4 text-[#A33F31] dark:text-[#C45B4B] shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-[#9E7E43] dark:text-[#C0A268] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#686E64] dark:text-[#A6AA9D] shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-elevated border backdrop-blur-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2',
            'bg-[#EAE8DF]/95 dark:bg-[#202421]/95 border-[#D5D2C5] dark:border-[#343B35]'
          )}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-[#242823] dark:text-[#F0EEE6]">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-0.5 text-xs text-[#686E64] dark:text-[#A6AA9D] leading-relaxed">
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg text-[#686E64] dark:text-[#A6AA9D] hover:text-[#242823] dark:hover:text-[#F0EEE6] hover:bg-[#E2DFD6] dark:hover:bg-[#272C28] transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};


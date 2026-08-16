'use client';

import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/shared/store';

const VARIANT_STYLES = {
  success: { icon: CheckCircle2, iconWrap: 'bg-emerald-100 dark:bg-emerald-950/50', iconColor: 'text-emerald-600' },
  error: { icon: AlertCircle, iconWrap: 'bg-red-100 dark:bg-red-950/50', iconColor: 'text-red-600' },
  info: { icon: Bell, iconWrap: 'bg-primary/10', iconColor: 'text-primary' },
} as const;

export function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const { icon: Icon, iconWrap, iconColor } = VARIANT_STYLES[toast.variant || 'info'];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-background border border-border shadow-lg rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className={`${iconWrap} p-1.5 rounded-full shrink-0`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{toast.title}</p>
              {toast.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toast.body}</p>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

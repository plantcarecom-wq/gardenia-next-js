'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Circle, Clock, Package, Truck, MapPin } from 'lucide-react';
import { formatDateTime } from '@/shared/lib/date';

type StatusEntry = {
  status: string;
  timestamp: string;
  note?: string;
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  processing: <Package className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <MapPin className="w-4 h-4" />,
  cancelled: <Circle className="w-4 h-4" />,
};

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

interface OrderTrackingTimelineProps {
  orderId: string;
  initialHistory: StatusEntry[];
  initialStatus: string;
}

export function OrderTrackingTimeline({ orderId, initialHistory, initialStatus }: OrderTrackingTimelineProps) {
  const [history, setHistory] = useState<StatusEntry[]>(initialHistory);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  // SSE-preferred, polling-fallback tracking hook (Phase 6.3)
  useEffect(() => {
    let es: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const startSSE = () => {
      try {
        es = new EventSource(`/api/v1/orders/${orderId}/track/stream`);
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.newEntries?.length > 0) {
              setHistory(prev => [...prev, ...data.newEntries]);
              setCurrentStatus(data.currentStatus);
            }
          } catch { /* ignore */ }
        };
        es.onerror = () => {
          es?.close();
          if (!closed) {
            // Fallback to polling after SSE fails
            setTimeout(() => { if (!closed) startSSE(); }, 5000);
          }
        };
      } catch {
        // SSE not available, use polling
        pollInterval = setInterval(async () => {
          try {
            const lastTs = history.length > 0 ? history[history.length - 1].timestamp : '';
            const res = await fetch(`/api/v1/orders/${orderId}/track/poll${lastTs ? `?since=${lastTs}` : ''}`);
            if (res.ok) {
              const data = await res.json();
              if (data.data?.statusHistory?.length > 0) {
                setHistory(prev => [...prev, ...data.data.statusHistory]);
                setCurrentStatus(data.data.currentStatus);
              }
            }
          } catch { /* ignore */ }
        }, 10000);
      }
    };

    startSSE();

    return () => {
      closed = true;
      es?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId]);

  const currentStepIndex = statusSteps.indexOf(currentStatus);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between px-2">
        {statusSteps.map((step, i) => {
          const isCompleted = i <= currentStepIndex;
          const isCurrent = i === currentStepIndex;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center ${isCurrent ? 'scale-110' : ''} transition-transform`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-gray-100 dark:bg-muted text-gray-400 dark:text-gray-600'
                }`}>
                  {statusIcons[step] || <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-2 capitalize font-medium ${
                  isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'
                }`}>{step}</span>
              </div>
              {i < statusSteps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-700 ${
                  i < currentStepIndex ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Timeline */}
      <div className="border-l-2 border-emerald-200 ml-5 space-y-0">
        {history.map((entry, i) => (
          <div key={i} className="relative pl-8 pb-6 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-background shadow-sm" />
            <div>
              <p className="font-semibold text-sm capitalize text-gray-900 dark:text-foreground">{entry.status}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(entry.timestamp)}
              </p>
              {entry.note && (
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 bg-gray-50 dark:bg-muted px-3 py-1.5 rounded-lg inline-block">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

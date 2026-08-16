import { StateCreator } from 'zustand';
import type { ToastSlice } from './toast.slice';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSlice {
  notifications: Notification[];
  unreadCount: number;
  notifLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id?: string) => Promise<void>;
  startSSE: () => void;
  stopSSE: () => void;
  _eventSource: EventSource | null;
}

export const createNotificationSlice: StateCreator<
  NotificationSlice & ToastSlice,
  [],
  [],
  NotificationSlice
> = (set, get) => ({
  notifications: [],
  unreadCount: 0,
  notifLoading: false,
  _eventSource: null,

  fetchNotifications: async () => {
    set({ notifLoading: true });
    try {
      const res = await fetch('/api/v1/notifications/poll');
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data.data.notifications || [],
          unreadCount: data.data.unreadCount || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      set({ notifLoading: false });
    }
  },

  markRead: async (id?: string) => {
    try {
      await fetch('/api/v1/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      });

      if (id) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      } else {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  },

  startSSE: () => {
    const existing = get()._eventSource;
    if (existing) existing.close();

    try {
      const es = new EventSource('/api/v1/notifications/stream');
      
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.notifications && payload.notifications.length > 0) {
            const existingIds = new Set(get().notifications.map((n) => n._id));
            const newNotifs: Notification[] = payload.notifications.filter(
              (n: Notification) => !existingIds.has(n._id)
            );
            set((state) => ({
              notifications: [...newNotifs, ...state.notifications],
              unreadCount: payload.unreadCount ?? state.unreadCount + newNotifs.length,
            }));
            for (const n of newNotifs) {
              get().pushToast({ title: n.title, body: n.body });
            }
          }
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        es.close();
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          get().startSSE();
        }, 5000);
      };

      set({ _eventSource: es });
    } catch {
      // SSE not supported — fall back to polling
      console.warn('SSE not supported; using polling fallback');
      setInterval(() => get().fetchNotifications(), 15000);
    }
  },

  stopSSE: () => {
    const es = get()._eventSource;
    if (es) {
      es.close();
      set({ _eventSource: null });
    }
  },
});

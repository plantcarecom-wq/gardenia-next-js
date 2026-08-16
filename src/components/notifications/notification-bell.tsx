'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/shared/store';
import { useSession } from 'next-auth/react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/shared/lib/date';

export function NotificationBell() {
  const { data: session, status } = useSession();
  const { notifications, unreadCount, fetchNotifications, markRead, startSSE, stopSSE } = useStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      startSSE();
      return () => stopSSE();
    }
  }, [status, fetchNotifications, startSSE, stopSSE]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status !== 'authenticated') return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white dark:bg-card rounded-xl shadow-xl border border-gray-100 dark:border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7 px-2 text-emerald-600 hover:text-emerald-700"
                onClick={() => markRead()}
              >
                <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-50 dark:divide-border">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-muted transition-colors flex gap-3 items-start ${
                    !notif.isRead ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markRead(notif._id);
                  }}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    notif.isRead ? 'bg-transparent' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${notif.isRead ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-foreground'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                      {formatDateTime(notif.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

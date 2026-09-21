import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications, type Notification, type NotificationType } from '../context/NotificationsContext';

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function typeIcon(type: NotificationType) {
  switch (type) {
    case 'success': return <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />;
    case 'info':    return <Info size={15} className="text-blue-400 shrink-0" />;
    case 'warning': return <AlertTriangle size={15} className="text-amber-400 shrink-0" />;
    case 'error':   return <XCircle size={15} className="text-rose-400 shrink-0" />;
  }
}

function typeBorder(type: NotificationType) {
  switch (type) {
    case 'success': return 'border-l-emerald-500/60';
    case 'info':    return 'border-l-blue-500/60';
    case 'warning': return 'border-l-amber-500/60';
    case 'error':   return 'border-l-rose-500/60';
  }
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`relative border-l-2 ${typeBorder(notification.type)} pl-3 pr-7 py-2.5 rounded-r-lg text-sm
        ${notification.read ? 'bg-slate-800/30' : 'bg-slate-700/40'}
        transition-colors`}
    >
      <div className="flex items-start gap-2">
        {typeIcon(notification.type)}
        <div className="min-w-0 flex-1">
          <div className={`font-medium leading-snug ${notification.read ? 'text-slate-400' : 'text-slate-200'}`}>
            {notification.title}
          </div>
          {notification.message && (
            <div className="text-xs text-slate-500 mt-0.5 leading-snug">{notification.message}</div>
          )}
          <div className="text-[10px] text-slate-600 mt-1">{formatRelativeTime(notification.timestamp)}</div>
        </div>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="absolute top-2 right-2 text-slate-600 hover:text-slate-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, dismiss, clearAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Mark all read when panel opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      const t = setTimeout(markAllRead, 500);
      return () => clearTimeout(t);
    }
  }, [open, unreadCount, markAllRead]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 text-[9px] font-bold bg-purple-500 text-white rounded-full flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass-panel shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-purple-400" />
              <span className="text-sm font-semibold text-slate-200">Activity Feed</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <CheckCheck size={13} />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell size={28} className="text-slate-700 mb-3" />
                <div className="text-sm text-slate-500">No activity yet</div>
                <div className="text-xs text-slate-600 mt-1">
                  Events like verifications and imports will appear here.
                </div>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onDismiss={dismiss} />
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-700/50 text-[10px] text-slate-600 flex items-center justify-between">
              <span>{notifications.length} total events</span>
              <span>Auto-cleared on logout</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

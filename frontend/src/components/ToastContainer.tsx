import { useEffect, useRef } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useNotifications, type Notification, type NotificationType } from '../context/NotificationsContext';

function toastIcon(type: NotificationType) {
  switch (type) {
    case 'success': return <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />;
    case 'info':    return <Info         size={18} className="text-blue-400 shrink-0 mt-0.5" />;
    case 'warning': return <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />;
    case 'error':   return <XCircle      size={18} className="text-rose-400 shrink-0 mt-0.5" />;
  }
}

function toastAccent(type: NotificationType) {
  switch (type) {
    case 'success': return 'border-l-emerald-500 shadow-emerald-900/30';
    case 'info':    return 'border-l-blue-500 shadow-blue-900/30';
    case 'warning': return 'border-l-amber-500 shadow-amber-900/30';
    case 'error':   return 'border-l-rose-500 shadow-rose-900/30';
  }
}

const TOAST_DURATION_MS = 4000;

function Toast({
  notification,
  onDismiss,
  index,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(notification.id);
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timerRef.current);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]
        bg-slate-800/95 backdrop-blur-xl
        border border-slate-700/60 border-l-2 ${toastAccent(notification.type)}
        rounded-xl px-4 py-3 shadow-xl
        animate-in slide-in-from-right-4 fade-in duration-300
      `}
      style={{ transform: `translateY(-${index * 4}px)` }}
    >
      {toastIcon(notification.type)}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-100 leading-snug">
          {notification.title}
        </div>
        {notification.message && (
          <div className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-2">
            {notification.message}
          </div>
        )}
      </div>
      <button
        onClick={() => {
          clearTimeout(timerRef.current);
          onDismiss(notification.id);
        }}
        className="text-slate-500 hover:text-slate-200 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden"
        aria-hidden
      >
        <div
          className={`h-full origin-left ${
            notification.type === 'success' ? 'bg-emerald-500'
            : notification.type === 'info'  ? 'bg-blue-500'
            : notification.type === 'warning' ? 'bg-amber-500'
            : 'bg-rose-500'
          }`}
          style={{
            animation: `toast-shrink ${TOAST_DURATION_MS}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, dismiss } = useNotifications();

  // Show only the 3 most recent unread toasts
  const toasts = notifications.filter(n => !n.read).slice(0, 3);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((n, i) => (
        <div key={n.id} className="pointer-events-auto relative">
          <Toast notification={n} onDismiss={dismiss} index={i} />
        </div>
      ))}
    </div>
  );
}

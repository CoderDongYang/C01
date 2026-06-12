import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const styleMap: Record<NotificationType, string> = {
  success: 'border-l-4 border-l-green-500',
  error: 'border-l-4 border-l-red-500',
  warning: 'border-l-4 border-l-yellow-500',
  info: 'border-l-4 border-l-blue-500',
};

interface ToastItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  onClose: () => void;
}

function ToastItem({ id, type, title, message, onClose }: ToastItemProps) {
  useEffect(() => {
    const el = document.getElementById(`toast-${id}`);
    if (el) {
      el.classList.add('animate-slide-in');
    }
  }, [id]);

  return (
    <div
      id={`toast-${id}`}
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg backdrop-blur-sm',
        styleMap[type],
      )}
      style={{
        animation: 'slideIn 0.3s ease-out forwards',
      }}
    >
      <div className="shrink-0 mt-0.5">{iconMap[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {message && (
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        .pointer-events-none > * {
          pointer-events: auto;
        }
      `}</style>
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          id={n.id}
          type={n.type}
          title={n.title}
          message={n.message}
          onClose={() => removeNotification(n.id)}
        />
      ))}
    </div>
  );
}

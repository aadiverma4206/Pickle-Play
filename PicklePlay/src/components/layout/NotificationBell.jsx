import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { timeAgo } from '../../lib/format';

export default function NotificationBell() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // Subscribing to the raw array (even though we read via getState() below)
  // is what makes this component re-render when a new notification arrives.
  useStore((s) => s.notifications);
  const unread = useStore((s) => (user ? s.unreadCountFor(user.id) : 0)); // returns a primitive count — safe
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const notifications = user ? useStore.getState().notificationsFor(user.id).slice(0, 6) : [];

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800">
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-ink-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-400">You're all caught up.</p>}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { markNotificationRead(n.id); setOpen(false); }}
                className={clsx('block w-full border-b border-ink-50 px-4 py-3 text-left last:border-0 hover:bg-ink-50', !n.isRead && 'bg-brand-50/50')}
              >
                <p className="text-sm font-medium text-ink-800">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.message}</p>
                <p className="mt-1 text-[11px] text-ink-400">{timeAgo(n.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

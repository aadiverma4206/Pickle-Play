import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, CalendarCheck, CalendarPlus, CreditCard, XCircle, ArrowUpCircle,
  Trophy, Swords, TrendingUp, Award, UserPlus, CheckCircle2, Flag, Wallet, GitBranch, Clock, Users,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { timeAgo } from '../../lib/format';
import clsx from 'clsx';

// Maps a notification `type` to a lucide icon + a color tone for its badge.
const TYPE_META = {
  GAME_JOINED: { icon: UserPlus, tone: 'brand' },
  GAME_PUBLISHED: { icon: CalendarPlus, tone: 'brand' },
  GAME_WAITLISTED: { icon: Clock, tone: 'warning' },
  GAME_CANCELLED: { icon: XCircle, tone: 'danger' },
  BOOKING_CONFIRMATION: { icon: CalendarCheck, tone: 'brand' },
  BOOKING_CANCELLED: { icon: XCircle, tone: 'danger' },
  PAYMENT_SUCCESS: { icon: CreditCard, tone: 'brand' },
  PAYMENT_FAILURE: { icon: XCircle, tone: 'danger' },
  WAITLIST_PROMOTION: { icon: ArrowUpCircle, tone: 'brand' },
  TOURNAMENT_REGISTRATION: { icon: Trophy, tone: 'accent' },
  TOURNAMENT_FIXTURE: { icon: GitBranch, tone: 'court' },
  TOURNAMENT_PARTNER_INVITE: { icon: UserPlus, tone: 'court' },
  TOURNAMENT_WINNER: { icon: Trophy, tone: 'accent' },
  TOURNAMENT_CANCELLED: { icon: XCircle, tone: 'danger' },
  MATCH_RESULT: { icon: Swords, tone: 'court' },
  RATING_UPDATE: { icon: TrendingUp, tone: 'court' },
  ACHIEVEMENT_UNLOCKED: { icon: Award, tone: 'accent' },
  COMMUNITY_REQUEST: { icon: Users, tone: 'court' },
  COMMUNITY_APPROVAL: { icon: CheckCircle2, tone: 'brand' },
  COMMUNITY_INVITATION: { icon: Users, tone: 'brand' },
  CHALLENGE_COMPLETE: { icon: Flag, tone: 'accent' },
  REFUND_STATUS: { icon: Wallet, tone: 'court' },
};

const TONE_CLASSES = {
  brand: 'bg-brand-100 text-brand-600',
  court: 'bg-court-100 text-court-600',
  accent: 'bg-accent-400/20 text-accent-600',
  warning: 'bg-accent-400/20 text-accent-600',
  danger: 'bg-red-100 text-red-600',
  neutral: 'bg-ink-100 text-ink-500',
};

// Fallback destinations for notifications that don't carry a refType/refId
// (e.g. the rating service pushes bare MATCH_RESULT / RATING_UPDATE notices).
const TYPE_FALLBACK_ROUTE = {
  MATCH_RESULT: '/performance',
  RATING_UPDATE: '/performance',
  TOURNAMENT_WINNER: '/tournaments',
  ACHIEVEMENT_UNLOCKED: '/achievements',
};

function routeFor(notification, store) {
  const { refType, refId, type } = notification;
  if (refType && refId) {
    switch (refType) {
      case 'GAME':
        return `/games/${refId}`;
      case 'BOOKING':
        return '/bookings';
      case 'TOURNAMENT':
        return `/tournaments/${refId}`;
      case 'COMMUNITY':
        return `/community/${refId}`;
      case 'ACHIEVEMENT':
        return '/achievements';
      case 'EVENT': {
        const event = store.getEvent(refId);
        return event ? `/community/${event.communityId}` : '/community';
      }
      case 'CHALLENGE': {
        const challenge = store.challenges.find((c) => c.id === refId);
        return challenge?.communityId ? `/community/${challenge.communityId}` : '/community';
      }
      default:
        break;
    }
  }
  return TYPE_FALLBACK_ROUTE[type] || null;
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [tab, setTab] = useState('all');

  if (!user) return <LoadingState label="Loading notifications…" />;

  const notifications = store.notificationsFor(user.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const list = tab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleRowClick = (n) => {
    if (!n.isRead) store.markNotificationRead(n.id);
    const path = routeFor(n, store);
    if (path) navigate(path);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader
        title="Notifications"
        subtitle="Everything happening across your games, bookings and tournaments."
        action={unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={CheckCheck} onClick={() => store.markAllRead(user.id)}>
            Mark all as read
          </Button>
        )}
      />

      <Tabs
        tabs={[
          { ...TABS[0], count: notifications.length },
          { ...TABS[1], count: unreadCount },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-4"
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={tab === 'unread' ? "You're all caught up" : 'No notifications yet'}
          message={tab === 'unread' ? 'No unread notifications right now.' : "Activity on your games, bookings and tournaments will show up here."}
        />
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const meta = TYPE_META[n.type] || { icon: Bell, tone: 'neutral' };
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={clsx(
                  'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                  n.isRead ? 'border-ink-100 bg-white hover:border-ink-200' : 'border-brand-200 bg-brand-50/50 hover:border-brand-300'
                )}
              >
                <span className={clsx('flex size-9 shrink-0 items-center justify-center rounded-full', TONE_CLASSES[meta.tone] || TONE_CLASSES.neutral)}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink-900">{n.title}</p>
                    {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-brand-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-600">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import clsx from 'clsx';

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-100 text-brand-700',
  court: 'bg-court-100 text-court-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-accent-400/25 text-accent-600',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-court-100 text-court-700',
};

// Maps common domain status strings to a sensible tone so callers can just
// pass the raw status without a lookup table at every call site.
const STATUS_TONE = {
  ACTIVE: 'success', CONFIRMED: 'success', SUCCESS: 'success', COMPLETED: 'neutral', RESOLVED: 'success',
  OPEN_FOR_JOINING: 'brand', PUBLISHED: 'brand', REGISTRATION_OPEN: 'brand',
  PENDING: 'warning', HOLD: 'warning', PAYMENT_PENDING: 'warning', TEAM_PENDING: 'warning', NEW: 'warning', INVESTIGATING: 'warning', ASSIGNED: 'warning', PROCESSING: 'warning', REFUND_PENDING: 'warning',
  FULL: 'info', LOCKED: 'info', CHECKED_IN: 'info', IN_PROGRESS: 'info', LIVE: 'info', UPCOMING: 'info',
  CANCELLED: 'danger', FAILED: 'danger', SUSPENDED: 'danger', BLOCKED: 'danger', BANNED: 'danger', MAINTENANCE: 'danger', CLOSED: 'danger', WALKOVER: 'danger', WITHDRAWN: 'danger', REJECTED: 'danger',
  REFUNDED: 'court', PARTIALLY_REFUNDED: 'court', DRAFT: 'neutral',
};

export default function Badge({ children, tone, status, className }) {
  const resolvedTone = tone || STATUS_TONE[status] || 'neutral';
  const label = children ?? (status ? status.replaceAll('_', ' ') : '');
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', TONES[resolvedTone], className)}>
      {label.toLowerCase ? label.toLowerCase() : label}
    </span>
  );
}

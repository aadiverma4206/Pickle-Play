import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function money(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function toDate(value) {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
}

export function formatDate(value, fmt = 'dd MMM yyyy') {
  const d = toDate(value);
  return d ? format(d, fmt) : '—';
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? format(d, 'dd MMM yyyy, h:mm a') : '—';
}

export function formatTime(value) {
  // value like "18:30"
  if (!value) return '—';
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'h:mm a');
}

export function timeAgo(value) {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function pct(value, digits = 0) {
  return `${(Number(value) || 0).toFixed(digits)}%`;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

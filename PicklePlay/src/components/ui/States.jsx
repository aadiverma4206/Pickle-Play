import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
import Button from './Button';

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink-400 shadow-sm">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-ink-400">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
        <AlertTriangle className="size-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {onRetry && <div className="mt-4"><Button variant="secondary" onClick={onRetry}>Try Again</Button></div>}
    </div>
  );
}

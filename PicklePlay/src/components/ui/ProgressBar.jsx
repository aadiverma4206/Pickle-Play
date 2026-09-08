import clsx from 'clsx';

export default function ProgressBar({ value, max = 100, tone = 'brand', className, showLabel = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const TONES = { brand: 'bg-brand-500', court: 'bg-court-500', accent: 'bg-accent-500', danger: 'bg-red-500' };
  return (
    <div className={clsx('w-full', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div className={clsx('h-full rounded-full transition-all', TONES[tone])} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <p className="mt-1 text-xs text-ink-500">{value} / {max}</p>}
    </div>
  );
}

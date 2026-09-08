import clsx from 'clsx';

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand', trend }) {
  const TONES = { brand: 'bg-brand-50 text-brand-600', court: 'bg-court-50 text-court-600', accent: 'bg-accent-400/20 text-accent-600', danger: 'bg-red-50 text-red-600', ink: 'bg-ink-100 text-ink-600' };
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        {Icon && <span className={clsx('flex size-8 items-center justify-center rounded-lg', TONES[tone])}><Icon className="size-4" /></span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
      {(hint || trend) && (
        <p className={clsx('mt-1 text-xs', trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-ink-500')}>
          {trend !== undefined ? `${trend > 0 ? '+' : ''}${trend} · ` : ''}{hint}
        </p>
      )}
    </div>
  );
}

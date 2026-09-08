import clsx from 'clsx';

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={clsx('flex gap-1 overflow-x-auto border-b border-ink-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            active === tab.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1.5 rounded-full bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

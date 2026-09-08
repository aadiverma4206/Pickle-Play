import clsx from 'clsx';

const baseInput = 'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-400';

export function Label({ children, required }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink-700">{children}{required && <span className="text-red-500"> *</span>}</label>;
}

export function HelpText({ children, error }) {
  if (!children) return null;
  return <p className={clsx('mt-1 text-xs', error ? 'text-red-600' : 'text-ink-500')}>{children}</p>;
}

export function Input({ className, error, ...props }) {
  return <input className={clsx(baseInput, error && 'border-red-300 focus:border-red-400 focus:ring-red-100', className)} {...props} />;
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return <textarea rows={rows} className={clsx(baseInput, 'resize-none', error && 'border-red-300 focus:border-red-400 focus:ring-red-100', className)} {...props} />;
}

export function Select({ className, error, children, ...props }) {
  return (
    <select className={clsx(baseInput, 'pr-8', error && 'border-red-300', className)} {...props}>
      {children}
    </select>
  );
}

export function FormRow({ label, required, error, help, children }) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error ? <HelpText error>{error}</HelpText> : help ? <HelpText>{help}</HelpText> : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={clsx('flex items-center gap-2 text-sm text-ink-700', className)}>
      <input type="checkbox" className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-300" {...props} />
      {label}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-ink-300')}
      >
        <span className={clsx('absolute top-0.5 size-4 rounded-full bg-white transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
      {label && <span className="text-sm text-ink-700">{label}</span>}
    </label>
  );
}

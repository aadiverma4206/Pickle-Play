import clsx from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('rounded-xl border border-ink-200 bg-white', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>;
}

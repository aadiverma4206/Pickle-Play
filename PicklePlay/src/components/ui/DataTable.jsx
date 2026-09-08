import clsx from 'clsx';
import { EmptyState } from './States';

/**
 * Renders as a real <table> from the sm breakpoint up, and as a stack of
 * cards (one per row, column header as label) below it. Every admin list
 * page in the app goes through this one component, so fixing the mobile
 * layout here fixes it everywhere at once — no page-by-page table hacks.
 */
export default function DataTable({ columns, rows, keyField = 'id', onRowClick, emptyTitle = 'No records found', emptyMessage }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <>
      {/* Tablet / desktop: standard table, horizontally scrollable if it still overflows. */}
      <div className="scroll-x hidden rounded-xl border border-ink-200 bg-white sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-ink-50/70' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-ink-800">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per row, columns become stacked label/value pairs. */}
      <div className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={row[keyField]}
            onClick={() => onRowClick?.(row)}
            className={clsx(
              'rounded-xl border border-ink-200 bg-white p-4',
              onRowClick && 'cursor-pointer active:bg-ink-50'
            )}
          >
            <div className="divide-y divide-ink-50">
              {columns.map((col) => {
                const value = col.render ? col.render(row) : row[col.key];
                if (!col.header) {
                  // Headerless columns (typically a trailing "actions" column)
                  // get their own unlabeled row instead of an empty label.
                  return <div key={col.key} className="flex flex-wrap items-center gap-2 py-2 first:pt-0 last:pb-0">{value}</div>;
                }
                return (
                  <div key={col.key} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{col.header}</span>
                    <span className="text-sm text-ink-800">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../../store';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select, Input, Label } from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { formatDateTime } from '../../../lib/format';

export default function AdminAuditLogPage() {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const logs = store.allAuditLogs();
  const modules = useMemo(() => [...new Set(logs.map((l) => l.module))].sort(), [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter((l) => (moduleFilter ? l.module === moduleFilter : true))
      .filter((l) => {
        if (!q) return true;
        return [l.action, l.module, l.recordId, l.note].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      })
      .filter((l) => (dateFrom ? l.createdAt.slice(0, 10) >= dateFrom : true))
      .filter((l) => (dateTo ? l.createdAt.slice(0, 10) <= dateTo : true));
  }, [logs, search, moduleFilter, dateFrom, dateTo]);

  const columns = [
    {
      key: 'admin',
      header: 'Actor / Role',
      render: (l) => {
        const admin = store.getUser(l.adminId);
        const name = admin?.name || l.actorName || l.adminId;
        const role = l.actorRole || admin?.role || 'STAFF';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div>
              <p className="font-medium text-ink-900 leading-tight">{name}</p>
              <span className="inline-block mt-0.5 rounded bg-ink-100 px-1.5 py-0.2 text-[10px] font-semibold text-ink-600">
                {role}
              </span>
            </div>
          </div>
        );
      },
    },
    { key: 'action', header: 'Action', render: (l) => <Badge tone="brand">{l.action.replaceAll('_', ' ')}</Badge> },
    { key: 'module', header: 'Module', render: (l) => <Badge tone="neutral">{l.module}</Badge> },
    {
      key: 'recordId',
      header: 'Security Reference',
      render: (l) => (
        <div>
          <span className="font-mono text-xs text-ink-700 font-semibold">{l.recordId}</span>
          {l.securityTag && (
            <p className="font-mono text-[10px] text-emerald-600 font-medium">{l.securityTag}</p>
          )}
        </div>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      render: (l) => (l.oldValue || l.newValue) ? (
        <span className="flex items-center gap-1.5 text-xs text-ink-600">
          <span className="max-w-[140px] truncate rounded bg-red-50 px-1.5 py-0.5 text-red-700" title={l.oldValue || ''}>{l.oldValue || '—'}</span>
          <ArrowRight className="size-3 shrink-0 text-ink-300" />
          <span className="max-w-[140px] truncate rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700" title={l.newValue || ''}>{l.newValue || '—'}</span>
        </span>
      ) : <span className="text-ink-300">—</span>,
    },
    { key: 'note', header: 'Note', render: (l) => l.note ? <span className="text-xs text-ink-500">{l.note}</span> : <span className="text-ink-300">—</span> },
    { key: 'createdAt', header: 'Timestamp', render: (l) => <span className="whitespace-nowrap text-xs text-ink-500">{formatDateTime(l.createdAt)}</span> },
  ];

  return (
    <div>
      <SectionHeader
        title="Audit Logs"
        subtitle="Every important administrative action, in full — nothing here can be edited or deleted."
      />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput className="lg:col-span-2" value={search} onChange={setSearch} placeholder="Search action, module, record or note…" />
          <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        emptyTitle="No audit log entries found"
        emptyMessage={logs.length === 0 ? 'Administrative actions will be recorded here as they happen.' : 'Try widening your search, module or date range.'}
      />
    </div>
  );
}

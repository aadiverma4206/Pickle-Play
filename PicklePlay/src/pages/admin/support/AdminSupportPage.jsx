import { useMemo, useState } from 'react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { TICKET_STATUS } from '../../../lib/stateMachines';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import { timeAgo } from '../../../lib/format';
import TicketManageDrawer from './TicketManageDrawer';

const CATEGORIES = ['Payment', 'Booking', 'Game', 'Tournament', 'Club', 'Player', 'Community', 'Technical'];

export default function AdminSupportPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [manageId, setManageId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...store.tickets]
      .filter((t) => (q ? t.subject.toLowerCase().includes(q) : true))
      .filter((t) => (statusFilter ? t.status === statusFilter : true))
      .filter((t) => (categoryFilter ? t.category === categoryFilter : true))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [store, search, statusFilter, categoryFilter]);

  const columns = [
    { key: 'user', header: 'User', render: (t) => store.getUser(t.userId)?.name || 'Unknown' },
    { key: 'category', header: 'Category', render: (t) => <Badge tone="neutral">{t.category}</Badge> },
    {
      key: 'subject',
      header: 'Subject',
      render: (t) => <span className="block max-w-[220px] truncate" title={t.subject}>{t.subject}</span>,
    },
    { key: 'status', header: 'Status', render: (t) => <Badge status={t.status} /> },
    { key: 'assigned', header: 'Assigned To', render: (t) => store.getUser(t.assignedTo)?.name || <span className="text-ink-400">Unassigned</span> },
    { key: 'created', header: 'Created', render: (t) => timeAgo(t.createdAt) },
    { key: 'updated', header: 'Updated', render: (t) => timeAgo(t.updatedAt) },
  ];

  return (
    <div>
      <SectionHeader title="Support Tickets" subtitle={`${filtered.length} of ${store.tickets.length} tickets shown`} />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by subject…" className="sm:col-span-2" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.values(TICKET_STATUS).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(t) => setManageId(t.id)}
        emptyTitle="No tickets match your filters"
        emptyMessage="Try widening your search or filters."
      />

      <TicketManageDrawer key={manageId || 'none'} ticketId={manageId} onClose={() => setManageId(null)} adminId={user?.id} />
    </div>
  );
}

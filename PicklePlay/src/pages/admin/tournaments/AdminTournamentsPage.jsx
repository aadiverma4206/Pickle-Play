import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { TOURNAMENT_STATUS } from '../../../lib/stateMachines';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Field';
import { formatDate } from '../../../lib/format';
import CreateTournamentModal from './CreateTournamentModal';

export default function AdminTournamentsPage() {
  const navigate = useNavigate();
  const admin = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const canManage = can(admin?.role, PERMISSIONS.TOURNAMENTS_MANAGE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.tournaments
      .filter((t) => (statusFilter ? t.status === statusFilter : true))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [store.tournaments, search, statusFilter]);

  const columns = [
    { key: 'name', header: 'Tournament', render: (row) => (
      <div>
        <p className="font-medium text-ink-900">{row.name}</p>
        <p className="text-xs text-ink-400">{row.category} · {row.skillLevel}</p>
      </div>
    ) },
    { key: 'venue', header: 'Venue', render: (row) => store.getClub(row.venueClubId)?.name || '—' },
    { key: 'dates', header: 'Dates', render: (row) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}` },
    { key: 'format', header: 'Format' },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'registrations', header: 'Registrations', render: (row) => {
      const active = store.registrationsFor(row.id).filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status)).length;
      return `${active}/${row.maxParticipants}`;
    } },
  ];

  return (
    <div>
      <SectionHeader
        title="Tournaments"
        subtitle="Manage tournaments across the platform."
        action={canManage && <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Tournament</Button>}
      />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by tournament name…" className="sm:col-span-2" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.values(TOURNAMENT_STATUS).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(row) => navigate(`/admin/tournaments/${row.id}`)}
        emptyTitle="No tournaments found"
        emptyMessage={store.tournaments.length === 0 ? 'Create your first tournament to get started.' : 'Try adjusting your search or filters.'}
      />

      <CreateTournamentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

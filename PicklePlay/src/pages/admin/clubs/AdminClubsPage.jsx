import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle2, Ban, XCircle, RotateCcw } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../../lib/permissions';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import CreateClubModal from './CreateClubModal';

const STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED'];

export default function AdminClubsPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // Full access (Super/Ops Admin) sees every club; a Club Manager only sees
  // the clubs they are assigned to manage (Spec Section 41).
  const canManageAll = can(user?.role, PERMISSIONS.CLUBS_MANAGE);
  const canManageOwn = can(user?.role, PERMISSIONS.CLUBS_MANAGE_OWN);
  const scopedClubs = canManageAll ? store.clubs : (user ? store.clubsManagedBy(user.id) : []);

  // scopedClubs is already a fresh array every render (clubsManagedBy is a
  // filtering getter), so a useMemo here would just recompute every time
  // anyway — plain computation in the render body is simpler and equivalent.
  const searchQuery = search.trim().toLowerCase();
  const filtered = [...scopedClubs]
    .filter((c) => (searchQuery ? c.name.toLowerCase().includes(searchQuery) || c.city.toLowerCase().includes(searchQuery) : true))
    .filter((c) => (statusFilter ? c.status === statusFilter : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleStatusChange = (club, toStatus, tone) => {
    const messages = {
      ACTIVE: `${club.name} will be visible and bookable across the platform.`,
      SUSPENDED: `${club.name} will be hidden from players and its courts made unbookable until reactivated.`,
      CLOSED: `${club.name} will be permanently closed. This cannot be easily undone.`,
    };
    const labels = { ACTIVE: 'Approve', SUSPENDED: 'Suspend', CLOSED: 'Close Club' };
    store.askConfirm({
      title: `${toStatus === 'ACTIVE' ? 'Approve' : toStatus === 'SUSPENDED' ? 'Suspend' : 'Close'} ${club.name}?`,
      message: messages[toStatus],
      confirmLabel: labels[toStatus],
      tone,
      onConfirm: () => {
        const r = store.setClubStatus(club.id, toStatus, user.id);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${club.name} is now ${toStatus.toLowerCase()}.`, 'success');
      },
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Club',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-400">{row.address}</p>
        </div>
      ),
    },
    { key: 'city', header: 'City' },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'courts', header: 'Courts', render: (row) => store.courtsForClub(row.id).length },
    {
      key: 'managers',
      header: 'Manager(s)',
      render: (row) => {
        const names = (row.managerIds || []).map((id) => store.getUser(id)?.name).filter(Boolean);
        return names.length ? names.join(', ') : <span className="text-ink-400">Unassigned</span>;
      },
    },
    ...(canManageAll
      ? [{
          key: 'actions',
          header: '',
          render: (row) => (
            <div className="flex flex-wrap items-center gap-2">
              {row.status === 'PENDING' && (
                <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'ACTIVE'); }}>Approve</Button>
              )}
              {row.status === 'ACTIVE' && (
                <Button size="sm" variant="outlineDanger" icon={Ban} onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'SUSPENDED', 'danger'); }}>Suspend</Button>
              )}
              {row.status === 'SUSPENDED' && (
                <Button size="sm" variant="secondary" icon={RotateCcw} onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'ACTIVE'); }}>Reactivate</Button>
              )}
              {row.status !== 'CLOSED' && (
                <Button size="sm" variant="outlineDanger" icon={XCircle} onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'CLOSED', 'danger'); }}>Close</Button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <SectionHeader
        title="Clubs & Courts"
        subtitle={`${filtered.length} of ${scopedClubs.length} clubs shown`}
        action={canManageAll ? <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Club</Button> : null}
      />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or city…" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(row) => navigate(`/admin/clubs/${row.id}`)}
        emptyTitle="No clubs match your filters"
        emptyMessage={canManageOwn && !canManageAll ? 'You are not assigned as a manager to any clubs yet.' : 'Try widening your search or filters.'}
      />

      {canManageAll && <CreateClubModal open={createOpen} onClose={() => setCreateOpen(false)} adminId={user?.id} />}
    </div>
  );
}

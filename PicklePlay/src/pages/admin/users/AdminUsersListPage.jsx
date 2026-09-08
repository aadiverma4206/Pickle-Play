import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS, ROLES, ROLE_LABELS } from '../../../lib/permissions';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../lib/format';
import SuspendUserModal from './SuspendUserModal';

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'BLOCKED'];

export default function AdminUsersListPage() {
  const navigate = useNavigate();
  const actingUser = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suspendTarget, setSuspendTarget] = useState(null); // user being suspended

  const canManage = can(actingUser?.role, PERMISSIONS.USERS_MANAGE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...store.users]
      .filter((u) => (q ? u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) : true))
      .filter((u) => (roleFilter ? u.role === roleFilter : true))
      .filter((u) => (statusFilter ? u.status === statusFilter : true))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [store.users, search, roleFilter, statusFilter]);

  const handleActivate = (u) => {
    store.askConfirm({
      title: 'Activate user?',
      message: `${u.name} will regain full access to the platform immediately.`,
      confirmLabel: 'Activate',
      onConfirm: () => {
        const r = store.setUserStatus(u.id, 'ACTIVE', actingUser.id, 'Reactivated by admin.');
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${u.name} has been activated.`, 'success');
      },
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.profileImage} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{row.name}</p>
            <p className="text-xs text-ink-400">{row.mobile}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (row) => <span className="text-ink-600">{row.email}</span> },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge tone={row.role === 'PLAYER' ? 'neutral' : 'brand'}>{ROLE_LABELS[row.role] || row.role}</Badge>,
    },
    { key: 'city', header: 'City', render: (row) => row.city || '—' },
    { key: 'skillLevel', header: 'Skill Level', render: (row) => (row.role === 'PLAYER' ? row.skillLevel : '—') },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'joined', header: 'Joined', render: (row) => formatDate(row.createdAt) },
    ...(canManage
      ? [{
          key: 'actions',
          header: '',
          render: (row) => {
            if (row.id === actingUser.id) return <span className="text-xs text-ink-400">You</span>;
            return row.status === 'ACTIVE' ? (
              <Button
                size="sm" variant="outlineDanger" icon={ShieldBan}
                onClick={(e) => { e.stopPropagation(); setSuspendTarget(row); }}
              >
                Suspend
              </Button>
            ) : (
              <Button
                size="sm" variant="secondary" icon={ShieldCheck}
                onClick={(e) => { e.stopPropagation(); handleActivate(row); }}
              >
                Activate
              </Button>
            );
          },
        }]
      : []),
  ];

  return (
    <div>
      <SectionHeader title="Users" subtitle={`Manage all platform users · ${filtered.length} of ${store.users.length} shown`} />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
        emptyTitle="No users match your filters"
        emptyMessage="Try widening your search or filters."
      />

      <SuspendUserModal
        open={!!suspendTarget}
        user={suspendTarget}
        actingUserId={actingUser?.id}
        onClose={() => setSuspendTarget(null)}
      />
    </div>
  );
}

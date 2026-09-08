import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
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
import CommunityManageDrawer from './CommunityManageDrawer';
import CreateCommunityModal from '../../community/CreateCommunityModal';

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED'];

export default function AdminCommunitiesPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [manageId, setManageId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Super/Ops Admin (COMMUNITIES_MANAGE or COMMUNITIES_VIEW_ALL) see every
  // community; a Community Admin/Moderator (COMMUNITIES_MODERATE_OWN) only
  // sees communities where they hold OWNER/ADMIN/MODERATOR membership —
  // mirrors the CLUB_MANAGER scoping pattern used on AdminClubsPage.
  const canManageAll = can(user?.role, PERMISSIONS.COMMUNITIES_MANAGE);
  const canViewAll = canManageAll || can(user?.role, PERMISSIONS.COMMUNITIES_VIEW_ALL);
  const moderatedIds = user
    ? store.communityMembers
        .filter((m) => m.userId === user.id && m.status === 'ACTIVE' && ['OWNER', 'ADMIN', 'MODERATOR'].includes(m.role))
        .map((m) => m.communityId)
    : [];
  const scoped = canViewAll ? store.communities : store.communities.filter((c) => moderatedIds.includes(c.id));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...scoped]
      .filter((c) => {
        if (!q) return true;
        const owner = store.getUser(c.ownerId);
        return c.name.toLowerCase().includes(q) || (owner?.name || '').toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
      })
      .filter((c) => (statusFilter ? c.status === statusFilter : true))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [scoped, search, statusFilter, store]);

  const columns = [
    {
      key: 'name',
      header: 'Community',
      render: (c) => (
        <div>
          <p className="font-medium text-ink-900">{c.name}</p>
          <p className="text-xs text-ink-400">{c.location} · {c.skillLevel}</p>
        </div>
      ),
    },
    { key: 'owner', header: 'Owner', render: (c) => store.getUser(c.ownerId)?.name || '—' },
    { key: 'members', header: 'Members', render: (c) => `${store.membersOf(c.id).length}${c.maxMembers ? ` / ${c.maxMembers}` : ''}` },
    { key: 'visibility', header: 'Visibility', render: (c) => <Badge tone={c.isPrivate ? 'neutral' : 'info'}>{c.isPrivate ? 'Private' : 'Public'}</Badge> },
    { key: 'status', header: 'Status', render: (c) => <Badge status={c.status} /> },
    {
      key: 'requests',
      header: 'Pending Requests',
      render: (c) => {
        const n = store.pendingRequestsFor(c.id).length;
        return n > 0 ? <Badge tone="warning">{n} pending</Badge> : <span className="text-ink-400">—</span>;
      },
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Communities"
        subtitle={`${filtered.length} of ${scoped.length} communities shown`}
        action={canManageAll && <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Community</Button>}
      />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, owner or location…" className="sm:col-span-2" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(c) => setManageId(c.id)}
        emptyTitle="No communities match your filters"
        emptyMessage={!canViewAll ? 'You are not an owner, admin or moderator of any community yet.' : 'Try widening your search or filters.'}
      />

      <CommunityManageDrawer
        key={manageId || 'none'}
        communityId={manageId}
        onClose={() => setManageId(null)}
        adminId={user?.id}
        canSuspend={canManageAll}
      />

      <CreateCommunityModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(community) => { setCreateOpen(false); setManageId(community.id); }}
      />
    </div>
  );
}

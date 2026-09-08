import { useMemo, useState } from 'react';
import { Eye, PlusCircle } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { GAME_STATUS } from '../../../lib/stateMachines';
import { can, PERMISSIONS } from '../../../lib/permissions';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate, formatTime, money } from '../../../lib/format';
import GameManageDrawer from './GameManageDrawer';
import CreateGameModal from '../../games/CreateGameModal';

const GAME_TYPES = ['Singles', 'Doubles', 'Mixed Doubles', 'Open Play', 'Friendly', 'Competitive'];

export default function AdminGamesPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [manageGameId, setManageGameId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const canManage = can(user?.role, PERMISSIONS.GAMES_MANAGE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...store.games]
      .filter((g) => {
        if (!q) return true;
        const organizer = store.getUser(g.organizerId);
        return g.name.toLowerCase().includes(q) || (organizer?.name || '').toLowerCase().includes(q);
      })
      .filter((g) => (statusFilter ? g.status === statusFilter : true))
      .filter((g) => (typeFilter ? g.gameType === typeFilter : true))
      .sort((a, b) => new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`));
  }, [store, search, statusFilter, typeFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Game',
      render: (g) => (
        <div>
          <p className="font-medium text-ink-900">{g.name}</p>
          <p className="text-xs text-ink-400">{g.gameType} · {g.skillLevel}</p>
        </div>
      ),
    },
    {
      key: 'venue',
      header: 'Club / Court',
      render: (g) => {
        const club = store.getClub(g.clubId);
        const court = store.getCourt(g.courtId);
        return <span>{club?.name}<br /><span className="text-xs text-ink-400">{court?.name}</span></span>;
      },
    },
    { key: 'organizer', header: 'Organizer', render: (g) => store.getUser(g.organizerId)?.name || '—' },
    {
      key: 'when',
      header: 'Date / Time',
      render: (g) => <span>{formatDate(g.date)}<br /><span className="text-xs text-ink-400">{formatTime(g.startTime)}–{formatTime(g.endTime)}</span></span>,
    },
    { key: 'players', header: 'Players', render: (g) => `${g.currentPlayers}/${g.maxPlayers}` },
    { key: 'status', header: 'Status', render: (g) => <Badge status={g.status} /> },
    { key: 'fee', header: 'Entry Fee', render: (g) => (g.entryFee > 0 ? money(g.entryFee) : 'Free') },
    {
      key: 'actions',
      header: '',
      render: (g) => (
        <Button size="sm" variant="secondary" icon={Eye} onClick={(e) => { e.stopPropagation(); setManageGameId(g.id); }}>Manage</Button>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Games"
        subtitle={`${filtered.length} of ${store.games.length} games shown`}
        action={canManage && <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Game</Button>}
      />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by game name or organizer…" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.values(GAME_STATUS).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Game Types</option>
            {GAME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(g) => setManageGameId(g.id)}
        emptyTitle="No games match your filters"
        emptyMessage="Try widening your search or filters."
      />

      <GameManageDrawer key={manageGameId || 'none'} gameId={manageGameId} onClose={() => setManageGameId(null)} adminId={user?.id} adminRole={user?.role} />

      <CreateGameModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(game) => { setCreateOpen(false); setManageGameId(game.id); }}
      />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, MapPin, Users as UsersIcon, ListChecks } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Select, Input } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatTime, money } from '../../lib/format';
import CreateGameModal from './CreateGameModal';

const GAME_TYPES = ['Singles', 'Doubles', 'Mixed Doubles', 'Open Play', 'Friendly', 'Competitive'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const VISIBLE_STATUSES = ['PUBLISHED', 'OPEN_FOR_JOINING', 'FULL'];

export default function FindGamesPage() {
  const [params, setParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(params.get('create') === '1');
  const navigate = useNavigate();
  const user = useCurrentUser();

  const games = useStore((s) => s.games);
  const clubs = useStore((s) => s.clubs);

  const [filters, setFilters] = useState({ club: '', skillLevel: '', gameType: '', date: '' });

  const filtered = useMemo(() => {
    return games
      .filter((g) => VISIBLE_STATUSES.includes(g.status) && !g.isPrivate)
      .filter((g) => (filters.club ? g.clubId === filters.club : true))
      .filter((g) => (filters.skillLevel ? g.skillLevel === filters.skillLevel : true))
      .filter((g) => (filters.gameType ? g.gameType === filters.gameType : true))
      .filter((g) => (filters.date ? g.date === filters.date : true))
      .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`));
  }, [games, filters]);

  const closeCreate = () => {
    setCreateOpen(false);
    if (params.get('create')) { params.delete('create'); setParams(params, { replace: true }); }
  };

  return (
    <div>
      <SectionHeader
        title="Find a Game"
        subtitle="Discover open games near you and join in seconds."
        action={<Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Game</Button>}
      />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Select value={filters.club} onChange={(e) => setFilters({ ...filters, club: e.target.value })}>
            <option value="">All Clubs</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={filters.gameType} onChange={(e) => setFilters({ ...filters, gameType: e.target.value })}>
            <option value="">All Game Types</option>
            {GAME_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select value={filters.skillLevel} onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}>
            <option value="">All Skill Levels</option>
            {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No games match your filters" message="Try widening your filters, or create your own game." action={<Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Game</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => {
            const club = clubs.find((c) => c.id === g.clubId);
            const organizer = useStore.getState().getUser(g.organizerId);
            const joined = user && useStore.getState().isUserInGame(g.id, user.id);
            return (
              <Card key={g.id} className="flex flex-col">
                <CardBody className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink-900">{g.name}</h3>
                    <Badge status={g.status} />
                  </div>
                  <div className="space-y-1 text-xs text-ink-500">
                    <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {club?.name}</p>
                    <p>{formatDate(g.date)} · {formatTime(g.startTime)}–{formatTime(g.endTime)}</p>
                    <p className="flex items-center gap-1.5"><UsersIcon className="size-3.5" /> {g.currentPlayers}/{g.maxPlayers} players · {g.skillLevel}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <Badge tone="neutral">{g.gameType}</Badge>
                    <span className="font-semibold text-ink-800">{g.entryFee > 0 ? money(g.entryFee) : 'Free'}</span>
                  </div>
                  <p className="text-xs text-ink-400">Organized by {organizer?.name}</p>
                </CardBody>
                <div className="border-t border-ink-100 px-5 py-3">
                  <Button className="w-full" variant={joined ? 'secondary' : 'primary'} onClick={() => navigate(`/games/${g.id}`)}>
                    {joined ? 'View Details' : g.status === 'FULL' ? 'Join Waitlist' : 'View & Join'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateGameModal open={createOpen} onClose={closeCreate} />
    </div>
  );
}

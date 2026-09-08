import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import Tabs from '../../components/ui/Tabs';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatTime } from '../../lib/format';
import CreateGameModal from './CreateGameModal';

export default function MyGamesPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const games = user ? store.gamesJoinedBy(user.id) : [];
  const organized = user ? store.gamesOrganizedBy(user.id) : [];
  const [tab, setTab] = useState('upcoming');
  const [createOpen, setCreateOpen] = useState(false);

  const all = [...new Map([...games, ...organized].map((g) => [g.id, g])).values()].sort((a, b) => new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter((g) => g.date >= today && !['CANCELLED', 'COMPLETED'].includes(g.status));
  const past = all.filter((g) => g.date < today || ['CANCELLED', 'COMPLETED'].includes(g.status));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      <SectionHeader title="My Games" subtitle="Games you're organizing or have joined." action={<Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Game</Button>} />
      <Tabs tabs={[{ value: 'upcoming', label: 'Upcoming', count: upcoming.length }, { value: 'past', label: 'Past', count: past.length }]} active={tab} onChange={setTab} className="mb-5" />
      {list.length === 0 ? (
        <EmptyState title={`No ${tab} games`} message={tab === 'upcoming' ? 'Find or create a game to get started.' : 'Your past games will show up here.'} action={tab === 'upcoming' ? <Button icon={PlusCircle} onClick={() => setCreateOpen(true)}>Create Game</Button> : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((g) => (
            <Card key={g.id}>
              <CardBody className="cursor-pointer" onClick={() => navigate(`/games/${g.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{g.name}</p>
                    <p className="mt-1 text-xs text-ink-500">{formatDate(g.date)} · {formatTime(g.startTime)}</p>
                  </div>
                  <Badge status={g.status} />
                </div>
                {g.organizerId === user.id && <Badge tone="brand" className="mt-2">You're organizing</Badge>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <CreateGameModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

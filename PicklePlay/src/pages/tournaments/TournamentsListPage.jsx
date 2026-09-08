import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, MapPin, Calendar, Users as UsersIcon } from 'lucide-react';
import { useStore } from '../../store';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import SearchInput from '../../components/ui/SearchInput';
import ProgressBar from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/States';
import { formatDate, money } from '../../lib/format';
import { TOURNAMENT_STATUS } from '../../lib/stateMachines';

const CATEGORIES = ['Singles', 'Doubles', 'Mixed Doubles'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const DEEMPHASIZED_STATUSES = ['DRAFT', 'CANCELLED'];
// Sort order so live/open tournaments surface first and draft/cancelled sink
// to the bottom, without hiding them (spec: de-emphasize, don't hide).
const STATUS_RANK = { REGISTRATION_OPEN: 0, LIVE: 1, UPCOMING: 2, REGISTRATION_CLOSED: 3, COMPLETED: 4, DRAFT: 5, CANCELLED: 6 };

export default function TournamentsListPage() {
  const navigate = useNavigate();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { tournaments } = store;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', skillLevel: '' });

  const filtered = useMemo(() => {
    return tournaments
      .filter((t) => (search ? t.name.toLowerCase().includes(search.toLowerCase()) : true))
      .filter((t) => (filters.status ? t.status === filters.status : true))
      .filter((t) => (filters.category ? t.category === filters.category : true))
      .filter((t) => (filters.skillLevel ? t.skillLevel === filters.skillLevel : true))
      .sort((a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || new Date(a.startDate) - new Date(b.startDate));
  }, [tournaments, search, filters]);

  return (
    <div>
      <SectionHeader title="Tournaments" subtitle="Discover and register for pickleball tournaments near you." />

      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tournaments…" />
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {Object.values(TOURNAMENT_STATUS).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select value={filters.skillLevel} onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}>
            <option value="">All Skill Levels</option>
            {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Trophy} title="No tournaments match your filters" message="Try widening your filters to see more tournaments." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const venue = store.getClub(t.venueClubId);
            const registeredCount = store.registrationsFor(t.id).filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status)).length;
            const deemphasized = DEEMPHASIZED_STATUSES.includes(t.status);
            return (
              <Card
                key={t.id}
                onClick={() => navigate(`/tournaments/${t.id}`)}
                className={`flex cursor-pointer flex-col transition-shadow hover:shadow-md ${deemphasized ? 'opacity-60 grayscale-[30%]' : ''}`}
              >
                <CardBody className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink-900">{t.name}</h3>
                    <Badge status={t.status} />
                  </div>
                  <div className="space-y-1 text-xs text-ink-500">
                    <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {venue?.name || '—'}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {formatDate(t.startDate)} – {formatDate(t.endDate)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Badge tone="neutral">{t.format}</Badge>
                    <Badge tone="neutral">{t.category}</Badge>
                    <Badge tone="neutral">{t.skillLevel}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink-800">{t.entryFee > 0 ? money(t.entryFee) : 'Free'}</span>
                    {t.prize && <span className="flex items-center gap-1 text-accent-600"><Trophy className="size-3.5" /> {t.prize}</span>}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
                      <span className="flex items-center gap-1"><UsersIcon className="size-3.5" /> Registered</span>
                      <span>{registeredCount}/{t.maxParticipants}</span>
                    </div>
                    <ProgressBar value={registeredCount} max={t.maxParticipants} tone={registeredCount >= t.maxParticipants ? 'danger' : 'brand'} />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

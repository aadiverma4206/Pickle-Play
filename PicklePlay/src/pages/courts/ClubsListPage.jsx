import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Clock, ChevronRight, Landmark } from 'lucide-react';
import { useStore } from '../../store';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import SearchInput from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/States';

const LOGO_TONES = [
  'from-brand-500 to-brand-600',
  'from-court-500 to-court-600',
  'from-accent-500 to-accent-600',
  'from-violet-500 to-violet-600',
];

function toneFor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % LOGO_TONES.length;
  return LOGO_TONES[h];
}

export default function ClubsListPage() {
  const navigate = useNavigate();
  const clubs = useStore((s) => s.clubs);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const activeClubs = useMemo(() => clubs.filter((c) => c.status === 'ACTIVE'), [clubs]);
  const cities = useMemo(() => [...new Set(activeClubs.map((c) => c.city))].sort(), [activeClubs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeClubs
      .filter((c) => (city ? c.city === city : true))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeClubs, search, city]);

  return (
    <div>
      <SectionHeader title="Clubs & Courts" subtitle="Browse partner clubs and book a court in minutes." />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search clubs by name or city…" />
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clubs match your search"
          message="Try a different search term or clear the city filter."
          action={(search || city) ? <Button variant="secondary" onClick={() => { setSearch(''); setCity(''); }}>Clear Filters</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((club) => (
            <Card key={club.id} className="flex flex-col overflow-hidden">
              <div className="relative h-32 w-full overflow-hidden bg-ink-900">
                {club.photos && club.photos[0] ? (
                  <>
                    <img
                      src={club.photos[0]}
                      alt={club.name}
                      className="size-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
                  </>
                ) : (
                  <div className={`flex size-full items-center justify-center bg-gradient-to-br ${toneFor(club.id)} text-white`}>
                    <Building2 className="size-10 opacity-90" />
                  </div>
                )}
                <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <Landmark className="size-3 text-brand-400" /> {club.city}
                </span>
              </div>
              <CardBody className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">{club.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                    <MapPin className="size-3.5 shrink-0" /> {club.address}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1.5"><Landmark className="size-3.5" /> {club.city}</span>
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {club.openingHours}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(club.facilities || []).slice(0, 4).map((f) => (
                    <Badge key={f} tone="neutral">{f}</Badge>
                  ))}
                  {(club.facilities || []).length > 4 && (
                    <Badge tone="neutral">+{club.facilities.length - 4} more</Badge>
                  )}
                </div>
              </CardBody>
              <div className="border-t border-ink-100 px-5 py-3">
                <Button className="w-full" icon={ChevronRight} onClick={() => navigate(`/courts/${club.id}`)}>
                  View Courts
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

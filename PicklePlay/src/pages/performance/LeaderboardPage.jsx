import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { MapPin, Users as UsersIcon } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import Tabs from '../../components/ui/Tabs';
import DataTable from '../../components/ui/DataTable';
import Avatar from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/States';
import { pct } from '../../lib/format';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const SCOPE_TABS = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'CITY', label: 'City' },
  { value: 'COMMUNITY', label: 'Community' },
];

// A cell that fully fills its <td>'s own padding box when highlighted, so a
// row highlight reads as one continuous band even though DataTable renders
// each column independently (we can't add per-row classes there without
// touching a shared component another agent owns).
function Cell({ highlight, className, children }) {
  return <div className={clsx('-mx-4 -my-3 px-4 py-3', highlight && 'bg-brand-50', className)}>{children}</div>;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [scope, setScope] = useState('GLOBAL');
  const [city, setCity] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [communityId, setCommunityId] = useState('');

  const cities = [...new Set(store.users.map((u) => u.city).filter(Boolean))].sort();

  const handleScopeChange = (value) => {
    setScope(value);
    if (value === 'CITY' && !city) setCity(user?.city || '');
  };

  const params = { limit: 50 };
  if (skillLevel) params.skillLevel = skillLevel;
  if (scope === 'CITY' && city) params.city = city;
  if (scope === 'COMMUNITY' && communityId) params.communityId = communityId;

  const needsCity = scope === 'CITY' && !city;
  const needsCommunity = scope === 'COMMUNITY' && !communityId;
  const rows = needsCity || needsCommunity ? [] : store.leaderboard(params).map((r) => ({ ...r, id: r.user.id }));

  const isMe = (row) => user && row.user.id === user.id;

  const columns = [
    { key: 'rank', header: '#', render: (row) => <Cell highlight={isMe(row)} className="font-semibold text-ink-700">{row.rank}</Cell> },
    {
      key: 'player',
      header: 'Player',
      render: (row) => (
        <Cell highlight={isMe(row)} className="flex items-center gap-3">
          <Avatar name={row.user.name} size="sm" />
          <div>
            <p className="font-medium text-ink-900">
              {row.user.name}
              {isMe(row) && <span className="ml-1.5 text-xs font-normal text-brand-600">(You)</span>}
            </p>
            <p className="text-xs text-ink-500">{row.user.city} · {row.user.skillLevel}</p>
          </div>
        </Cell>
      ),
    },
    { key: 'rating', header: 'Rating', render: (row) => <Cell highlight={isMe(row)} className="font-semibold text-ink-900">{row.rating?.skillRating ?? '—'}</Cell> },
    { key: 'matches', header: 'Matches', render: (row) => <Cell highlight={isMe(row)}>{row.performance?.matchesPlayed ?? 0}</Cell> },
    { key: 'wins', header: 'Wins', render: (row) => <Cell highlight={isMe(row)}>{row.performance?.wins ?? 0}</Cell> },
    { key: 'winRate', header: 'Win Rate', render: (row) => <Cell highlight={isMe(row)}>{pct(row.performance?.winRate)}</Cell> },
  ];

  return (
    <div>
      <SectionHeader title="Leaderboard" subtitle="See how you stack up against other players." />

      <Card className="mb-5">
        <CardBody className="space-y-4">
          <Tabs tabs={SCOPE_TABS} active={scope} onChange={handleScopeChange} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {scope === 'CITY' && (
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Select a city</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
            {scope === 'COMMUNITY' && (
              <Select value={communityId} onChange={(e) => setCommunityId(e.target.value)}>
                <option value="">Select a community</option>
                {store.communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            <Select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
              <option value="">All Skill Levels</option>
              {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </CardBody>
      </Card>

      {needsCity ? (
        <EmptyState icon={MapPin} title="Select a city" message="Choose a city above to see its leaderboard." />
      ) : needsCommunity ? (
        <EmptyState icon={UsersIcon} title="Select a community" message="Choose a community above to see its leaderboard." />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyField="id"
          onRowClick={(row) => navigate(`/profile/${row.user.id}`)}
          emptyTitle="No ranked players found"
          emptyMessage="Try widening your filters."
        />
      )}
    </div>
  );
}

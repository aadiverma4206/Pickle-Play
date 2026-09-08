import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft, Pencil, Swords, TrendingUp, ShieldCheck, ListChecks, CheckCircle2, XCircle,
  Percent, Flame, Trophy, Award, Star, MapPin, Hand, BarChart3, ArrowUpCircle, ArrowDownCircle,
  Crown, Lock,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROLE_LABELS } from '../../lib/permissions';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { formatDate, pct } from '../../lib/format';
import EditProfileModal from './EditProfileModal';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'performance', label: 'Performance' },
  { value: 'matches', label: 'Matches' },
  { value: 'tournaments', label: 'Tournaments' },
  { value: 'achievements', label: 'Achievements' },
  { value: 'reviews', label: 'Reviews' },
];

// Round labels come from the fixture generator as 'Final' / 'Semi Final' /
// 'Quarter Final' / 'Round of N'. Rank ascending = furthest round first, so
// we can find "how far a registration progressed" by sorting on this.
function roundRank(label) {
  if (label === 'Final') return 0;
  if (label === 'Semi Final') return 1;
  if (label === 'Quarter Final') return 2;
  const match = /Round of (\d+)/.exec(label || '');
  if (match) return Math.log2(Number(match[1])) - 1;
  return 99;
}

function streakLabel(n) {
  if (n === undefined || n === null) return '—';
  if (n > 0) return `${n}W`;
  if (n < 0) return `${Math.abs(n)}L`;
  return '0';
}

function StarRow({ value = 0, size = 'size-5' }) {
  const filledPct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div className="relative inline-flex">
      <div className="flex gap-1 text-ink-200">
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={size} fill="currentColor" strokeWidth={0} />)}
      </div>
      <div className="absolute inset-0 flex gap-1 overflow-hidden text-accent-500" style={{ width: `${filledPct}%` }}>
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`${size} shrink-0`} fill="currentColor" strokeWidth={0} />)}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  );
}

function OverviewTab({ profileUser, earnedAchievements, onViewAchievements }) {
  const recent = [...earnedAchievements].sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)).slice(0, 4);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">About</h3>
        <dl className="space-y-2 text-sm">
          <InfoRow label="Gender" value={profileUser.gender || '—'} />
          <InfoRow label="Playing Hand" value={profileUser.playingHand || '—'} />
          <InfoRow label="Area" value={profileUser.area || '—'} />
          <InfoRow label="City" value={profileUser.city || '—'} />
          <InfoRow label="Member Since" value={formatDate(profileUser.createdAt)} />
        </dl>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Recent Achievements</h3>
          <button onClick={onViewAchievements} className="text-xs font-medium text-brand-600 hover:underline">View all</button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-400">No achievements earned yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2">
                <span className="text-xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium text-ink-800">{a.name}</p>
                  <p className="text-xs text-ink-500">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({ rating, performance }) {
  if (!rating || !performance) {
    return <EmptyState icon={BarChart3} title="No performance data" message="This player hasn't played any rated matches yet." />;
  }
  const history = rating.ratingHistory || [];
  const chartPoints = history.map((h) => ({ date: formatDate(h.date, 'dd MMM'), rating: h.rating }));
  return (
    <div className="space-y-6">
      {chartPoints.length === 0 ? (
        <EmptyState icon={BarChart3} title="No rating history" message="Rating history will appear here once matches are played." />
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8891a0' }} axisLine={{ stroke: '#d7dbe1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8891a0' }} axisLine={{ stroke: '#d7dbe1' }} tickLine={false} domain={['dataMin - 40', 'dataMax + 40']} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#d7dbe1', fontSize: 12 }} labelStyle={{ color: '#171a23', fontWeight: 600 }} />
              <Line type="monotone" dataKey="rating" stroke="#2e8a28" strokeWidth={2.5} dot={{ r: 3, fill: '#2e8a28' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Flame} label="Longest Streak" value={`${performance.longestStreak}W`} tone="brand" />
        <StatCard icon={ArrowUpCircle} label="Points Scored" value={performance.pointsScored} tone="court" />
        <StatCard icon={ArrowDownCircle} label="Points Conceded" value={performance.pointsConceded} tone="danger" />
        <StatCard icon={Crown} label="Titles" value={performance.titles} tone="accent" />
      </div>
    </div>
  );
}

function MatchesTab({ store, profileUserId }) {
  const records = store.gameResults
    .filter((r) => r.winnerIds.includes(profileUserId) || r.loserIds.includes(profileUserId))
    .map((r) => {
      const iWon = r.winnerIds.includes(profileUserId);
      const opponents = (iWon ? r.loserIds : r.winnerIds).map((id) => store.getUser(id)?.name).filter(Boolean);
      const partners = (iWon ? r.winnerIds : r.loserIds).filter((id) => id !== profileUserId).map((id) => store.getUser(id)?.name).filter(Boolean);
      const game = store.getGame(r.gameId);
      return {
        id: r.id,
        iWon,
        opponents,
        partners,
        score: r.score,
        date: game?.date || (r.createdAt || '').slice(0, 10),
        gameName: game?.name || 'Casual Game',
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (records.length === 0) {
    return <EmptyState icon={Swords} title="No matches recorded yet" message="Match results will appear here once games are played." />;
  }

  return (
    <div className="space-y-2">
      {records.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink-800">
              {r.partners.length > 0 ? `w/ ${r.partners.join(' & ')} vs ` : 'vs '}
              {r.opponents.join(' & ') || 'Unknown opponent'}
            </p>
            <p className="text-xs text-ink-500">{r.gameName} · {formatDate(r.date)} · {r.score}</p>
          </div>
          <Badge tone={r.iWon ? 'success' : 'danger'}>{r.iWon ? 'Win' : 'Loss'}</Badge>
        </div>
      ))}
    </div>
  );
}

function tournamentResultLabel(store, reg) {
  const matches = store.matchesFor(reg.tournamentId).filter((m) => m.team1?.regId === reg.id || m.team2?.regId === reg.id);
  const withResults = matches
    .map((m) => ({ match: m, result: store.resultForMatch(m.id) }))
    .filter((x) => x.result)
    .sort((a, b) => roundRank(a.match.round) - roundRank(b.match.round));
  if (withResults.length === 0) return null;
  const { match, result } = withResults[0];
  const iWon = result.winnerRegId === reg.id;
  if (match.round === 'Final') return iWon ? 'Champion' : 'Runner-up';
  return iWon ? `Won ${match.round}` : `Lost in ${match.round}`;
}

function TournamentsTab({ store, profileUserId }) {
  const registrations = store.registrationsForUser(profileUserId);
  if (registrations.length === 0) {
    return <EmptyState icon={Trophy} title="No tournaments yet" message="Tournament registrations will appear here." />;
  }
  const sorted = [...registrations].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  return (
    <div className="space-y-2">
      {sorted.map((reg) => {
        const tournament = store.getTournament(reg.tournamentId);
        const resultLabel = tournamentResultLabel(store, reg);
        return (
          <div key={reg.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-800">{tournament?.name || 'Tournament'}</p>
              <p className="text-xs text-ink-500">{tournament ? `${formatDate(tournament.startDate)} · ${tournament.category}` : '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              {resultLabel && (
                <Badge tone={resultLabel === 'Champion' ? 'warning' : resultLabel.startsWith('Won') ? 'success' : 'neutral'}>{resultLabel}</Badge>
              )}
              <Badge status={reg.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AchievementsTab({ achievements }) {
  if (achievements.length === 0) {
    return <EmptyState icon={Award} title="No achievements available" message="Check back soon for new badges to earn." />;
  }
  const sorted = [...achievements].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) return new Date(b.earnedAt) - new Date(a.earnedAt);
    return (a.conditionValue || 0) - (b.conditionValue || 0);
  });
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {sorted.map((a) => (
        <div key={a.id} className={`flex flex-col items-center gap-2 rounded-xl border p-5 text-center ${a.earned ? 'border-brand-200 bg-brand-50/40' : 'border-ink-200 opacity-60 grayscale'}`}>
          <span className="text-4xl">{a.icon}</span>
          <p className="text-sm font-semibold text-ink-900">{a.name}</p>
          <p className="text-xs text-ink-500">{a.description}</p>
          <Badge tone={a.earned ? 'brand' : 'neutral'}>{a.points} pts</Badge>
          {a.earned ? (
            <p className="text-[11px] font-medium text-brand-700">Unlocked {formatDate(a.earnedAt)}</p>
          ) : (
            <p className="flex items-center gap-1 text-[11px] text-ink-400"><Lock className="size-3" /> Locked</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewsTab({ rating }) {
  if (!rating) return <EmptyState icon={Star} title="No reviews yet" message="Community ratings will appear here." />;
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <StarRow value={rating.communityRating} size="size-8" />
      <p className="text-2xl font-bold text-ink-900">{rating.communityRating?.toFixed(1) ?? '—'} <span className="text-sm font-normal text-ink-400">/ 5</span></p>
      <p className="text-sm text-ink-500">Based on {rating.communityRatingCount || 0} community rating{rating.communityRatingCount === 1 ? '' : 's'}</p>
      <p className="mt-2 max-w-md text-xs text-ink-400">
        This community rating reflects sportsmanship and reliability as rated by other players after games — it's separate from the Skill Rating ({rating.skillRating}), which measures competitive performance.
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  if (!currentUser) return <LoadingState label="Loading…" />;

  const profileUserId = userId || currentUser.id;
  const profileUser = store.getUser(profileUserId);

  if (!profileUser) {
    return (
      <EmptyState
        title="Player not found"
        message="This profile doesn't exist or may have been removed."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  const isOwn = profileUser.id === currentUser.id;
  const rating = store.getRating(profileUser.id);
  const performance = store.getPerformance(profileUser.id);
  const achievements = store.achievementsForUser(profileUser.id);
  const earnedAchievements = achievements.filter((a) => a.earned);

  return (
    <div className="mx-auto max-w-4xl">
      {!isOwn && (
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
          <ArrowLeft className="size-4" /> Back
        </button>
      )}

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={profileUser.name} src={profileUser.profileImage} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-ink-900">{profileUser.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                  <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {[profileUser.area, profileUser.city].filter(Boolean).join(', ') || '—'}</span>
                  {profileUser.playingHand && <span className="flex items-center gap-1"><Hand className="size-3.5" /> {profileUser.playingHand}-handed</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {profileUser.skillLevel && <Badge tone="brand">{profileUser.skillLevel}</Badge>}
                  {profileUser.role !== 'PLAYER' && <Badge tone="neutral">{ROLE_LABELS[profileUser.role] || profileUser.role}</Badge>}
                </div>
              </div>
              <div>
                {isOwn ? (
                  <Button icon={Pencil} onClick={() => setEditOpen(true)}>Edit Profile</Button>
                ) : (
                  <Button icon={Swords} onClick={() => navigate(`/head-to-head/${profileUser.id}`)}>Head to Head</Button>
                )}
              </div>
            </div>
            {profileUser.bio && <p className="mt-4 text-sm text-ink-600">{profileUser.bio}</p>}
          </div>
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={TrendingUp} label="Skill Rating" value={rating?.skillRating ?? '—'} tone="brand" />
        <StatCard icon={ShieldCheck} label="Reliability" value={rating ? pct(rating.reliabilityScore) : '—'} tone="court" />
        <StatCard icon={ListChecks} label="Matches" value={performance?.matchesPlayed ?? 0} tone="ink" />
        <StatCard icon={Percent} label="Win Rate" value={performance ? pct(performance.winRate) : '—'} tone="accent" />
        <StatCard icon={Flame} label="Current Streak" value={streakLabel(performance?.currentStreak)} tone={(performance?.currentStreak ?? 0) >= 0 ? 'brand' : 'danger'} />
        <StatCard icon={CheckCircle2} label="Wins" value={performance?.wins ?? 0} tone="brand" />
        <StatCard icon={XCircle} label="Losses" value={performance?.losses ?? 0} tone="danger" />
        <StatCard icon={Trophy} label="Tournament Wins" value={performance?.tournamentWins ?? 0} tone="accent" />
        <StatCard icon={Award} label="Achievements" value={earnedAchievements.length} tone="court" />
      </div>

      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-5 pt-1" />
        <CardBody>
          {tab === 'overview' && (
            <OverviewTab profileUser={profileUser} earnedAchievements={earnedAchievements} onViewAchievements={() => setTab('achievements')} />
          )}
          {tab === 'performance' && <PerformanceTab rating={rating} performance={performance} />}
          {tab === 'matches' && <MatchesTab store={store} profileUserId={profileUser.id} />}
          {tab === 'tournaments' && <TournamentsTab store={store} profileUserId={profileUser.id} />}
          {tab === 'achievements' && <AchievementsTab achievements={achievements} />}
          {tab === 'reviews' && <ReviewsTab rating={rating} />}
        </CardBody>
      </Card>

      {isOwn && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={profileUser} />}
    </div>
  );
}

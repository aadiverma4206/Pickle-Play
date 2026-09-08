import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, ListChecks, Percent, Flame, ArrowUpCircle, ArrowDownCircle, Trophy, Medal, Crown, Award, BarChart3 } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Tabs from '../../components/ui/Tabs';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { formatDate, pct, clamp } from '../../lib/format';

const RANGE_TABS = [
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: '1Y', label: '1 Year' },
  { value: 'ALL', label: 'All Time' },
];
const RANGE_DAYS = { '7D': 7, '30D': 30, '3M': 90, '6M': 180, '1Y': 365 };

function streakLabel(n) {
  if (n === undefined || n === null) return '—';
  if (n > 0) return `${n}W`;
  if (n < 0) return `${Math.abs(n)}L`;
  return '0';
}

// Illustrative only — this prototype has no real per-shot tracking, so these
// six sub-skills are derived from the win rate / rating / streak / points a
// player already has on file. See the "Estimated" label in the card below.
function estimateSkills(performance, rating) {
  const wr = performance?.winRate ?? 50;
  const streak = performance?.currentStreak ?? 0;
  const longest = performance?.longestStreak ?? 0;
  const sr = rating?.skillRating ?? 1000;
  const rel = rating?.reliabilityScore ?? 80;
  const scored = performance?.pointsScored ?? 0;
  const conceded = performance?.pointsConceded ?? 0;
  const pointShare = scored + conceded > 0 ? (scored / (scored + conceded)) * 100 : 50;

  return [
    { label: 'Serve', tone: 'brand', value: clamp(Math.round(wr * 0.5 + sr / 40), 0, 100) },
    { label: 'Return', tone: 'court', value: clamp(Math.round(pointShare * 0.6 + wr * 0.3), 0, 100) },
    { label: 'Volley', tone: 'accent', value: clamp(Math.round(50 + longest * 4 - Math.max(0, -streak) * 3), 0, 100) },
    { label: 'Dink', tone: 'brand', value: clamp(Math.round(rel), 0, 100) },
    { label: 'Attack', tone: 'court', value: clamp(Math.round(wr * 0.6 + Math.max(0, streak) * 5), 0, 100) },
    { label: 'Defense', tone: 'accent', value: clamp(Math.round(rel * 0.5 + (100 - pointShare) * 0.4), 0, 100) },
  ];
}

export default function PerformancePage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [range, setRange] = useState('ALL');

  const performance = user ? store.getPerformance(user.id) : null;
  const rating = user ? store.getRating(user.id) : null;

  if (!user || !performance || !rating) return <LoadingState label="Loading your performance…" />;

  const history = rating.ratingHistory || [];
  let chartData = history;
  if (range !== 'ALL') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
    chartData = history.filter((h) => new Date(h.date) >= cutoff);
  }
  const chartPoints = chartData.map((h) => ({ date: formatDate(h.date, 'dd MMM'), rating: h.rating }));
  const skills = estimateSkills(performance, rating);

  return (
    <div>
      <SectionHeader
        title="My Performance"
        subtitle="Your skill rating, match history and estimated play style."
        action={(
          <>
            <Button variant="secondary" size="sm" icon={Trophy} onClick={() => navigate('/leaderboard')}>Leaderboard</Button>
            <Button variant="secondary" size="sm" icon={Award} onClick={() => navigate('/achievements')}>Achievements</Button>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TrendingUp} label="Skill Rating" value={rating.skillRating} tone="brand" />
        <StatCard icon={ListChecks} label="Matches Played" value={performance.matchesPlayed} tone="court" />
        <StatCard icon={Percent} label="Win Rate" value={pct(performance.winRate)} tone="accent" />
        <StatCard icon={Flame} label="Current Streak" value={streakLabel(performance.currentStreak)} tone={performance.currentStreak >= 0 ? 'brand' : 'danger'} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Rating History" subtitle="Skill rating trend over time" />
        <CardBody>
          <Tabs tabs={RANGE_TABS} active={range} onChange={setRange} className="mb-4" />
          {chartPoints.length === 0 ? (
            <EmptyState icon={BarChart3} title="No rating history in this range" message="Try a wider time range to see your trend." />
          ) : (
            <div className="h-64 w-full">
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
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Flame} label="Longest Streak" value={`${performance.longestStreak}W`} tone="brand" />
        <StatCard icon={ArrowUpCircle} label="Points Scored" value={performance.pointsScored} tone="court" />
        <StatCard icon={ArrowDownCircle} label="Points Conceded" value={performance.pointsConceded} tone="danger" />
        <StatCard icon={Trophy} label="Tournament Wins" value={performance.tournamentWins} tone="accent" />
        <StatCard icon={Medal} label="Finals" value={performance.finals} tone="court" />
        <StatCard icon={Crown} label="Titles" value={performance.titles} tone="brand" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Skill Analysis" subtitle="Estimated — prototype statistics based on match history, not real sensor or shot-tracking data." />
        <CardBody className="space-y-4">
          {skills.map((s) => (
            <div key={s.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-ink-700">{s.label}</span>
                <span className="text-ink-500">{s.value}%</span>
              </div>
              <ProgressBar value={s.value} max={100} tone={s.tone} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

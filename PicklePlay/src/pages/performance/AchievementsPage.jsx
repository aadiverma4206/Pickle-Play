import clsx from 'clsx';
import { Award, Star, Trophy, Lock } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { formatDate, pct } from '../../lib/format';

function conditionLabel(a) {
  const n = a.conditionValue;
  switch (a.conditionType) {
    case 'MATCHES_PLAYED': return `Play ${n} match${n === 1 ? '' : 'es'}`;
    case 'WINS': return `Win ${n} match${n === 1 ? '' : 'es'}`;
    case 'STREAK': return `Win ${n} matches in a row`;
    case 'TOURNAMENT_WIN': return `Win ${n} tournament${n === 1 ? '' : 's'}`;
    case 'COMMUNITIES_JOINED': return `Join ${n} communit${n === 1 ? 'y' : 'ies'}`;
    case 'DOUBLES_PLAYED': return `Play ${n} doubles matches`;
    case 'RATING_GAIN': return `Gain ${n}+ rating points`;
    default: return a.description || 'Keep playing to unlock this.';
  }
}

function AchievementCard({ achievement }) {
  const { earned, earnedAt, icon, name, description, points } = achievement;
  return (
    <Card className={clsx('flex flex-col items-center gap-2 p-5 text-center', earned ? 'border-brand-200 bg-brand-50/40' : 'opacity-60 grayscale')}>
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-semibold text-ink-900">{name}</p>
      <p className="text-xs text-ink-500">{description}</p>
      <Badge tone={earned ? 'brand' : 'neutral'}>{points} pts</Badge>
      {earned ? (
        <p className="text-[11px] font-medium text-brand-700">Unlocked {formatDate(earnedAt)}</p>
      ) : (
        <p className="flex items-center gap-1 text-[11px] text-ink-400"><Lock className="size-3" /> {conditionLabel(achievement)}</p>
      )}
    </Card>
  );
}

export default function AchievementsPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  if (!user) return <LoadingState label="Loading achievements…" />;

  const achievements = store.achievementsForUser(user.id);
  const earned = achievements.filter((a) => a.earned);
  const totalPoints = earned.reduce((sum, a) => sum + (a.points || 0), 0);
  const completion = achievements.length ? Math.round((earned.length / achievements.length) * 100) : 0;

  const sorted = [...achievements].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) return new Date(b.earnedAt) - new Date(a.earnedAt);
    return (a.conditionValue || 0) - (b.conditionValue || 0);
  });

  return (
    <div>
      <SectionHeader title="Achievements" subtitle="Badges you've earned by playing, winning and staying active." />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Award} label="Unlocked" value={`${earned.length}/${achievements.length}`} tone="brand" />
        <StatCard icon={Star} label="Points Earned" value={totalPoints} tone="accent" />
        <StatCard icon={Trophy} label="Completion" value={pct(completion)} tone="court" />
      </div>

      {achievements.length === 0 ? (
        <EmptyState icon={Award} title="No achievements available yet" message="Check back soon for new badges to earn." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((a) => <AchievementCard key={a.id} achievement={a} />)}
        </div>
      )}
    </div>
  );
}

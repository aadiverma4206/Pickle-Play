import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swords, ChevronRight, Users as UsersIcon, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import SearchInput from '../../components/ui/SearchInput';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { formatDate, pct } from '../../lib/format';

function streakLabel(n) {
  if (n === undefined || n === null) return '—';
  if (n > 0) return `${n}W`;
  if (n < 0) return `${Math.abs(n)}L`;
  return '0';
}

function PlayerBlock({ user, highlight }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/profile/${user.id}`)} className="flex flex-col items-center gap-2 rounded-lg px-4 py-2 text-center hover:bg-ink-50">
      <Avatar name={user.name} size="lg" />
      <p className={`text-sm font-semibold ${highlight ? 'text-brand-700' : 'text-ink-900'}`}>{user.name}</p>
      <p className="text-xs text-ink-500">{user.city} · {user.skillLevel}</p>
    </button>
  );
}

/** Builds the head-to-head match history between two players by scanning
 *  gameResults (casual games — winnerIds/loserIds are userIds) and
 *  matchResults (tournament matches — winnerRegId/loserRegId are
 *  registration ids, cross-referenced against matches[].team1/team2). */
function buildHeadToHead(store, meId, oppId) {
  const records = [];

  for (const r of store.gameResults) {
    const meWon = r.winnerIds.includes(meId) && r.loserIds.includes(oppId);
    const meLost = r.loserIds.includes(meId) && r.winnerIds.includes(oppId);
    if (!meWon && !meLost) continue;
    const game = store.getGame(r.gameId);
    records.push({
      id: r.id,
      context: game?.name || 'Casual Game',
      date: game?.date || (r.createdAt || '').slice(0, 10),
      score: r.score,
      iWon: meWon,
    });
  }

  for (const r of store.matchResults) {
    const match = store.matches.find((m) => m.id === r.matchId);
    if (!match || !match.team1 || !match.team2) continue;
    const p1 = match.team1.playerIds || [];
    const p2 = match.team2.playerIds || [];
    const meInTeam1 = p1.includes(meId);
    const meInTeam2 = p2.includes(meId);
    const oppInTeam1 = p1.includes(oppId);
    const oppInTeam2 = p2.includes(oppId);
    const areOpponents = (meInTeam1 && oppInTeam2) || (meInTeam2 && oppInTeam1);
    if (!areOpponents) continue;
    const myRegId = meInTeam1 ? match.team1.regId : match.team2.regId;
    const tournament = store.getTournament(match.tournamentId);
    records.push({
      id: r.id,
      context: `${tournament?.name || 'Tournament'} · ${match.round || 'Match'}`,
      date: match.scheduledDate,
      score: r.score,
      iWon: r.winnerRegId === myRegId,
    });
  }

  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function HeadToHeadPage() {
  const { opponentId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [query, setQuery] = useState('');

  if (!user) return <LoadingState label="Loading…" />;

  const opponent = opponentId ? store.getUser(opponentId) : null;

  if (!opponentId || (opponentId && !opponent)) {
    const candidates = store.users
      .filter((u) => u.id !== user.id && u.role === 'PLAYER' && u.status === 'ACTIVE')
      .filter((u) => !query || u.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="mx-auto max-w-2xl">
        <SectionHeader title="Head-to-Head" subtitle="Pick a player to compare your stats and match history." />
        {opponentId && !opponent && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">We couldn't find that player. Pick someone else below.</p>
        )}
        <Card>
          <CardBody className="space-y-4">
            <SearchInput value={query} onChange={setQuery} placeholder="Search players by name…" />
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {candidates.length === 0 ? (
                <EmptyState icon={UsersIcon} title="No players found" message="Try a different search." />
              ) : candidates.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/head-to-head/${u.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-50"
                >
                  <Avatar name={u.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">{u.name}</p>
                    <p className="text-xs text-ink-500">{u.city} · {u.skillLevel}</p>
                  </div>
                  <ChevronRight className="size-4 text-ink-300" />
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const myRating = store.getRating(user.id);
  const oppRating = store.getRating(opponent.id);
  const myPerf = store.getPerformance(user.id);
  const oppPerf = store.getPerformance(opponent.id);

  const records = buildHeadToHead(store, user.id, opponent.id);
  const totalMatches = records.length;
  const myWins = records.filter((r) => r.iWon).length;
  const oppWins = totalMatches - myWins;

  const statRows = [
    { label: 'Skill Rating', me: myRating?.skillRating ?? '—', opp: oppRating?.skillRating ?? '—' },
    { label: 'Matches Played', me: myPerf?.matchesPlayed ?? 0, opp: oppPerf?.matchesPlayed ?? 0 },
    { label: 'Win Rate', me: pct(myPerf?.winRate), opp: pct(oppPerf?.winRate) },
    { label: 'Current Streak', me: streakLabel(myPerf?.currentStreak), opp: streakLabel(oppPerf?.currentStreak) },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate('/head-to-head')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Change opponent
      </button>

      <Card className="mb-6">
        <CardBody className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-around">
          <PlayerBlock user={user} highlight />
          <div className="text-center">
            <p className="text-3xl font-bold text-ink-900">{myWins} - {oppWins}</p>
            <p className="text-xs uppercase tracking-wide text-ink-400">{totalMatches} match{totalMatches === 1 ? '' : 'es'} played</p>
          </div>
          <PlayerBlock user={opponent} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Stat Comparison" />
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 text-left font-medium">Stat</th>
                <th className="py-2 text-center font-medium">You</th>
                <th className="py-2 text-center font-medium">{opponent.name.split(' ')[0]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {statRows.map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 text-ink-600">{row.label}</td>
                  <td className="py-2.5 text-center font-semibold text-ink-900">{row.me}</td>
                  <td className="py-2.5 text-center font-semibold text-ink-900">{row.opp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`Recent Matches (${totalMatches})`} />
        <CardBody className="space-y-2">
          {records.length === 0 ? (
            <EmptyState icon={Swords} title="No matches yet" message={`You and ${opponent.name.split(' ')[0]} haven't played each other yet.`} />
          ) : records.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink-800">{r.context}</p>
                <p className="text-xs text-ink-500">{formatDate(r.date)} · {r.score}</p>
              </div>
              <Badge tone={r.iWon ? 'success' : 'danger'}>{r.iWon ? 'Win' : 'Loss'}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

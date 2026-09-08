import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, MapPinned, Trophy, Users, TrendingUp, Award, CalendarClock } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser, useCurrentPerformance, useCurrentRating } from '../../hooks/useCurrentUser';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatTime, money } from '../../lib/format';

export default function HomePage() {
  const user = useCurrentUser();
  const performance = useCurrentPerformance();
  const rating = useCurrentRating();
  const navigate = useNavigate();

  // Whole-store subscription — see the note above useStoreShallow's export
  // in store/index.js: our getters build fresh arrays every call, so they
  // must be invoked in the render body off a stable store reference rather
  // than inside a `useStore(selector)` (which would infinite-loop).
  const store = useStore();
  const { games, clubs, tournaments, communities } = store;
  const bookings = user ? store.bookingsForUser(user.id) : [];
  const myGames = user ? store.gamesJoinedBy(user.id) : [];
  const achievements = user ? store.achievementsForUser(user.id) : [];

  const nearbyGames = games
    .filter((g) => ['OPEN_FOR_JOINING', 'PUBLISHED'].includes(g.status) && g.date >= new Date().toISOString().slice(0, 10))
    .slice(0, 4);
  const upcomingBooking = bookings.find((b) => b.status === 'CONFIRMED' && b.date >= new Date().toISOString().slice(0, 10));
  const upcomingGame = myGames.find((g) => g.date >= new Date().toISOString().slice(0, 10) && g.status !== 'CANCELLED');
  const upcomingTournament = tournaments.find((t) => ['REGISTRATION_OPEN', 'UPCOMING'].includes(t.status));
  const popularCommunities = [...communities].sort((a, b) => b.maxMembers - a.maxMembers).slice(0, 3);
  const earnedAchievements = achievements.filter((a) => a.earned).slice(-3).reverse();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-brand-100">Welcome back,</p>
            <h1 className="text-2xl font-bold">{user?.name?.split(' ')[0]} 👋</h1>
            <p className="mt-1 text-sm text-brand-100">Rating {rating?.skillRating} · {performance?.wins}W-{performance?.losses}L · {performance?.winRate}% win rate</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Search} onClick={() => navigate('/games')}>Find Game</Button>
            <Button variant="secondary" icon={PlusCircle} onClick={() => navigate('/games?create=1')}>Create Game</Button>
            <Button variant="secondary" icon={MapPinned} onClick={() => navigate('/courts')}>Book Court</Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TrendingUp} label="Skill Rating" value={rating?.skillRating} tone="brand" />
        <StatCard icon={Trophy} label="Tournament Wins" value={performance?.tournamentWins || 0} tone="accent" />
        <StatCard icon={Award} label="Achievements" value={achievements.filter((a) => a.earned).length} tone="court" />
        <StatCard icon={Users} label="Communities" value={communities.filter((c) => store.membershipOf(c.id, user?.id)).length} tone="ink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Games near you" action={<Link to="/games" className="text-sm font-medium text-brand-600 hover:underline">See all</Link>} />
            <CardBody className="space-y-3">
              {nearbyGames.length === 0 && <EmptyState title="No open games right now" message="Be the first to create one!" action={<Button size="sm" icon={PlusCircle} onClick={() => navigate('/games?create=1')}>Create Game</Button>} />}
              {nearbyGames.map((g) => {
                const club = clubs.find((c) => c.id === g.clubId);
                return (
                  <button key={g.id} onClick={() => navigate(`/games/${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3 text-left hover:border-brand-200 hover:bg-brand-50/40">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{g.name}</p>
                      <p className="text-xs text-ink-500">{club?.name} · {formatDate(g.date)} · {formatTime(g.startTime)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={g.status} />
                      <span className="text-xs font-medium text-ink-500">{g.currentPlayers}/{g.maxPlayers}</span>
                    </div>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Popular communities" action={<Link to="/community" className="text-sm font-medium text-brand-600 hover:underline">Explore</Link>} />
            <CardBody className="grid gap-3 sm:grid-cols-3">
              {popularCommunities.map((c) => (
                <button key={c.id} onClick={() => navigate(`/community/${c.id}`)} className="rounded-xl border border-ink-100 p-3 text-left hover:border-brand-200 hover:bg-brand-50/40">
                  <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                  <p className="mt-1 text-xs text-ink-500">{c.location} · {c.skillLevel}</p>
                </button>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming" />
            <CardBody className="space-y-3 text-sm">
              {upcomingGame ? (
                <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
                  <CalendarClock className="size-4 text-brand-600" />
                  <div>
                    <p className="font-medium text-ink-800">{upcomingGame.name}</p>
                    <p className="text-xs text-ink-500">{formatDate(upcomingGame.date)} · {formatTime(upcomingGame.startTime)}</p>
                  </div>
                </div>
              ) : <p className="text-ink-400">No upcoming games.</p>}
              {upcomingBooking ? (
                <div className="flex items-center gap-2 rounded-lg bg-court-50 px-3 py-2">
                  <MapPinned className="size-4 text-court-600" />
                  <div>
                    <p className="font-medium text-ink-800">Court booked</p>
                    <p className="text-xs text-ink-500">{formatDate(upcomingBooking.date)} · {formatTime(upcomingBooking.startTime)} · {money(upcomingBooking.amount)}</p>
                  </div>
                </div>
              ) : <p className="text-ink-400">No upcoming bookings.</p>}
              {upcomingTournament && (
                <div className="flex items-center gap-2 rounded-lg bg-accent-400/15 px-3 py-2">
                  <Trophy className="size-4 text-accent-600" />
                  <div>
                    <p className="font-medium text-ink-800">{upcomingTournament.name}</p>
                    <p className="text-xs text-ink-500"><Link to={`/tournaments/${upcomingTournament.id}`} className="hover:underline">View details</Link></p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent achievements" action={<Link to="/achievements" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>} />
            <CardBody className="space-y-2">
              {earnedAchievements.length === 0 && <p className="text-sm text-ink-400">Play matches to start earning badges.</p>}
              {earnedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2">
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-ink-800">{a.name}</p>
                    <p className="text-xs text-ink-500">{a.description}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

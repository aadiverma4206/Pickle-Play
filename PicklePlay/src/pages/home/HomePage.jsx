import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, PlusCircle, MapPinned, Trophy, Users, TrendingUp, Award,
  CalendarClock, ShieldCheck, Zap, Lock, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser, useCurrentPerformance, useCurrentRating } from '../../hooks/useCurrentUser';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatTime, money } from '../../lib/format';
import RoleActivityTrackerModal from '../../components/ui/RoleActivityTrackerModal';

export default function HomePage() {
  const user = useCurrentUser();
  const performance = useCurrentPerformance();
  const rating = useCurrentRating();
  const navigate = useNavigate();
  const [trackerOpen, setTrackerOpen] = useState(false);

  const store = useStore();
  const { games, clubs, tournaments, communities } = store;
  const bookings = user ? store.bookingsForUser(user.id) : [];
  const myGames = user ? store.gamesJoinedBy(user.id) : [];
  const achievements = user ? store.achievementsForUser(user.id) : [];

  const nearbyGames = games
    .filter((g) => ['OPEN_FOR_JOINING', 'PUBLISHED', 'IN_PROGRESS'].includes(g.status) && g.date >= new Date().toISOString().slice(0, 10))
    .slice(0, 4);
  const upcomingBooking = bookings.find((b) => b.status === 'CONFIRMED' && b.date >= new Date().toISOString().slice(0, 10));
  const upcomingGame = myGames.find((g) => g.date >= new Date().toISOString().slice(0, 10) && g.status !== 'CANCELLED');
  const upcomingTournament = tournaments.find((t) => ['REGISTRATION_OPEN', 'UPCOMING'].includes(t.status));
  const popularCommunities = [...communities].sort((a, b) => b.maxMembers - a.maxMembers).slice(0, 3);
  const earnedAchievements = achievements.filter((a) => a.earned).slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* Live Sports Ticker */}
      <div className="overflow-hidden rounded-xl border border-emerald-900/40 bg-emerald-950 px-4 py-2 text-xs font-semibold text-emerald-300 shadow-sm flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-emerald-400 shrink-0 uppercase tracking-wider font-bold">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping"></span>
          LIVE SPORTS FEED
        </span>
        <p className="truncate text-emerald-200">
          🎾 Instant Matchmaking & Court Bookings Active · 🛡️ Price Protection (₹200–₹2,00,000) Active · 🔒 100% Refunds Before Match Start · 📊 Real-Time Role Audit Tracking
        </p>
      </div>

      {/* Hero Action Card with Energetic Sports Styling */}
      <div className="sports-gradient-hero relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-sm border border-white/20">
              <Zap className="size-3.5 text-yellow-300" /> Grassroots Pickleball Arena
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready for match day, {user?.name?.split(' ')[0]}?
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Skill Rating <span className="font-bold text-white">{rating?.skillRating}</span> · Form:{' '}
              <span className="font-bold text-yellow-300">{performance?.wins}W - {performance?.losses}L</span>{' '}
              ({performance?.winRate}% win rate). Join an open match or organize your own court session today.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              variant="secondary"
              icon={Search}
              onClick={() => navigate('/games')}
              className="bg-white text-emerald-950 font-bold hover:bg-emerald-50 shadow-md"
            >
              Find Match
            </Button>
            <Button
              variant="secondary"
              icon={PlusCircle}
              onClick={() => navigate('/games?create=1')}
              className="bg-emerald-500 text-white font-bold hover:bg-emerald-400 shadow-md border-0"
            >
              Create Game
            </Button>
            <Button
              variant="secondary"
              icon={MapPinned}
              onClick={() => navigate('/courts')}
              className="bg-white/20 text-white font-semibold hover:bg-white/30 backdrop-blur-sm border border-white/30"
            >
              Book Court
            </Button>
            <button
              type="button"
              onClick={() => setTrackerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-2 text-xs font-semibold text-white hover:bg-black/50 backdrop-blur-sm border border-white/20 transition-all"
            >
              <ShieldCheck className="size-4 text-emerald-300" /> Role Tracker
            </button>
          </div>
        </div>

        {/* Subtle Decorative Tennis Ball / Court Graphic */}
        <div className="absolute -bottom-12 -right-12 size-56 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TrendingUp} label="Skill Rating" value={rating?.skillRating} tone="brand" />
        <StatCard icon={Trophy} label="Tournament Wins" value={performance?.tournamentWins || 0} tone="accent" />
        <StatCard icon={Award} label="Achievements" value={achievements.filter((a) => a.earned).length} tone="court" />
        <StatCard icon={Users} label="Communities" value={communities.filter((c) => store.membershipOf(c.id, user?.id)).length} tone="ink" />
      </div>

      {/* Data Transparency & Fair Play Security Widget */}
      <div className="rounded-2xl border border-ink-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/70 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900">Platform Data Transparency & Role Security Guarantee</h3>
              <p className="text-xs text-ink-500">Every match, role action, and fee is audited for fair play.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTrackerOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-court-700 hover:text-court-800"
          >
            Open Live Role Tracker <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="mt-3.5 grid gap-3 sm:grid-cols-3 text-xs">
          <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-ink-100 shadow-2xs">
            <Lock className="size-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-ink-900">Creator Price Protection</p>
              <p className="text-ink-500 mt-0.5">Player-created matches cannot have their price modified by managers or admins.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-ink-100 shadow-2xs">
            <CheckCircle2 className="size-4 text-court-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-ink-900">Guaranteed Refunds</p>
              <p className="text-ink-500 mt-0.5">100% instant refund on cancellations before start. Permanently locked once match begins.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-ink-100 shadow-2xs">
            <Zap className="size-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-ink-900">Fair Price Boundaries</p>
              <p className="text-ink-500 mt-0.5">Match fees are verified between ₹200 and ₹2,00,000 to prevent predatory pricing.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Matches Section */}
          <Card>
            <CardHeader
              title="Matches Near You"
              subtitle="Pick-up games & competitive matches ready to join"
              action={<Link to="/games" className="text-sm font-semibold text-brand-600 hover:underline">See all matches →</Link>}
            />
            <CardBody className="space-y-3">
              {nearbyGames.length === 0 && (
                <EmptyState
                  title="No open games right now"
                  message="Be the first to create one with protected price bounds!"
                  action={<Button size="sm" icon={PlusCircle} onClick={() => navigate('/games?create=1')}>Create Game</Button>}
                />
              )}
              {nearbyGames.map((g) => {
                const club = clubs.find((c) => c.id === g.clubId);
                const isLive = g.status === 'IN_PROGRESS';
                const courtPhoto = club?.photos?.[0] || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=300&auto=format&fit=crop&q=80';

                return (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/games/${g.id}`)}
                    className="sports-card-hover flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-3.5 text-left hover:border-court-300"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={courtPhoto}
                        alt="Court"
                        className="size-14 rounded-xl object-cover shrink-0 border border-ink-100 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-ink-900 truncate">{g.name}</p>
                          {isLive && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-red-600 border border-red-200 animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5 truncate">
                          {club?.name} · {formatDate(g.date)} at {formatTime(g.startTime)}
                        </p>
                        <p className="text-[11px] text-ink-400 mt-0.5">
                          {g.gameType} · {g.skillLevel} · {g.entryFee > 0 ? money(g.entryFee) : 'Free to Play'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge status={g.status} />
                      <span className="text-xs font-semibold text-ink-600 bg-ink-100 px-2 py-0.5 rounded-full">
                        {g.currentPlayers}/{g.maxPlayers} players
                      </span>
                    </div>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          {/* Popular Communities */}
          <Card>
            <CardHeader
              title="Popular Communities & Clubs"
              subtitle="Connect with local pickleball athletes in your city"
              action={<Link to="/community" className="text-sm font-semibold text-brand-600 hover:underline">Explore all →</Link>}
            />
            <CardBody className="grid gap-3 sm:grid-cols-3">
              {popularCommunities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/community/${c.id}`)}
                  className="sports-card-hover rounded-2xl border border-ink-100 bg-white p-4 text-left hover:border-brand-300"
                >
                  <p className="text-sm font-bold text-ink-900">{c.name}</p>
                  <p className="mt-1 text-xs text-ink-500">{c.location} · {c.skillLevel}</p>
                  <span className="mt-3 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                    Active Group
                  </span>
                </button>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Your Schedule" />
            <CardBody className="space-y-3 text-sm">
              {upcomingGame ? (
                <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3 border border-brand-100">
                  <CalendarClock className="size-5 text-brand-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-ink-900 truncate">{upcomingGame.name}</p>
                    <p className="text-xs text-ink-500">{formatDate(upcomingGame.date)} · {formatTime(upcomingGame.startTime)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-400">No scheduled matches today.</p>
              )}

              {upcomingBooking ? (
                <div className="flex items-center gap-3 rounded-xl bg-court-50 p-3 border border-court-100">
                  <MapPinned className="size-5 text-court-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-ink-900 truncate">Court Booked</p>
                    <p className="text-xs text-ink-500">{formatDate(upcomingBooking.date)} · {formatTime(upcomingBooking.startTime)} · {money(upcomingBooking.amount)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-400">No active court reservations.</p>
              )}

              {upcomingTournament && (
                <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xs">
                  {upcomingTournament.banner && (
                    <img
                      src={upcomingTournament.banner}
                      alt="Tournament"
                      className="h-24 w-full object-cover"
                    />
                  )}
                  <div className="p-3">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      FEATURED TOURNAMENT
                    </span>
                    <p className="mt-1 font-bold text-ink-900">{upcomingTournament.name}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{upcomingTournament.prize}</p>
                    <Link
                      to={`/tournaments/${upcomingTournament.id}`}
                      className="mt-2 block text-xs font-bold text-court-600 hover:underline"
                    >
                      Register Now →
                    </Link>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Achievements"
              action={<Link to="/achievements" className="text-xs font-semibold text-brand-600 hover:underline">All</Link>}
            />
            <CardBody className="space-y-2">
              {earnedAchievements.length === 0 && <p className="text-xs text-ink-400">Play matches to unlock achievement badges.</p>}
              {earnedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5">
                  <span className="text-2xl">{a.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-ink-900">{a.name}</p>
                    <p className="text-[11px] text-ink-500">{a.description}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <RoleActivityTrackerModal open={trackerOpen} onClose={() => setTrackerOpen(false)} />
    </div>
  );
}


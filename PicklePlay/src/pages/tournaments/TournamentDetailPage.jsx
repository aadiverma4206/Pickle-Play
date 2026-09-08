import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users as UsersIcon, Trophy, Medal, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { registerForTournament, respondToPartnerInvite, withdrawRegistration } from '../../services/tournamentService';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { LoadingState, EmptyState } from '../../components/ui/States';
import { formatDate, formatTime, money } from '../../lib/format';
import RegisterModal from './RegisterModal';

export default function TournamentDetailPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { toast, askConfirm } = store;

  const tournament = store.getTournament(tournamentId);
  const registrations = store.registrationsFor(tournamentId);
  const matches = store.matchesFor(tournamentId);
  const venue = tournament ? store.getClub(tournament.venueClubId) : null;
  const organizer = tournament ? store.getUser(tournament.organizerId) : null;
  const [registerOpen, setRegisterOpen] = useState(false);

  if (!tournament) return <LoadingState label="Loading tournament…" />;

  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED');
  const activeCount = registrations.filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status)).length;
  const isFull = activeCount >= tournament.maxParticipants;
  const todayStr = new Date().toISOString().slice(0, 10);
  const deadlinePassed = (tournament.registrationEnd || '').slice(0, 10) < todayStr;

  const myRegistrations = user ? registrations.filter((r) => r.userId === user.id || r.partnerId === user.id) : [];
  const inviteForMe = myRegistrations.find((r) => r.partnerId === user?.id && r.status === 'TEAM_PENDING');
  const myActiveReg = myRegistrations.find((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status) && r.id !== inviteForMe?.id);
  const canRegister = tournament.status === 'REGISTRATION_OPEN' && !deadlinePassed && !isFull;

  const finalMatch = matches.find((m) => m.round === 'Final');
  const finalResult = finalMatch ? store.resultForMatch(finalMatch.id) : null;
  const championTeam = finalResult && finalMatch
    ? (finalResult.winnerRegId === finalMatch.team1?.regId ? finalMatch.team1 : finalMatch.team2)
    : null;

  const roundsPresent = [...new Set(matches.map((m) => m.round))].sort((a, b) => roundRank(b) - roundRank(a));

  const handleRespond = (accept) => {
    const r = respondToPartnerInvite(inviteForMe.id, accept);
    if (!r.ok) return toast(r.error, 'error');
    toast(accept ? 'Invite accepted — your team is confirmed!' : 'Invite declined.', accept ? 'success' : 'info');
  };

  const handleWithdraw = (reg) => {
    askConfirm({
      title: 'Withdraw from tournament?',
      message: 'Any eligible refund will be processed automatically based on the withdrawal policy.',
      confirmLabel: 'Withdraw',
      tone: 'danger',
      onConfirm: () => {
        const r = withdrawRegistration(reg.id, user.id);
        if (!r.ok) return toast(r.error, 'error');
        toast('You have withdrawn from the tournament.', 'success');
      },
    });
  };

  const handleQuickRegister = () => {
    askConfirm({
      title: 'Register for this tournament?',
      message: `You'll be registered as a solo player for ${tournament.name}.${tournament.entryFee > 0 ? ` A payment of ${money(tournament.entryFee)} will be processed.` : ''}`,
      confirmLabel: 'Register',
      onConfirm: () => {
        const r = registerForTournament(tournament.id, user.id);
        if (!r.ok) return toast(r.error, 'error');
        toast(`You're registered for ${tournament.name}!`, 'success');
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate('/tournaments')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Back to Tournaments
      </button>

      {tournament.status === 'COMPLETED' && championTeam && (
        <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-accent-400 to-accent-600 text-white">
          <CardBody className="flex items-center gap-4">
            <Medal className="size-10 shrink-0" />
            <div>
              <p className="text-sm text-white/80">Champion</p>
              <h2 className="text-xl font-bold">{championTeam.name}</h2>
              <p className="mt-0.5 text-sm text-white/80">Won the final {finalResult.score}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader
          title={tournament.name}
          subtitle={`${tournament.category} · ${tournament.format} · ${tournament.skillLevel}`}
          action={<Badge status={tournament.status} className="text-sm" />}
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm text-ink-600 sm:grid-cols-4">
            <Info icon={MapPin} label={venue?.name || '—'} sub={venue?.city} />
            <Info icon={Calendar} label={`${formatDate(tournament.startDate)} – ${formatDate(tournament.endDate)}`} sub="Tournament dates" />
            <Info icon={Clock} label={formatDate(tournament.registrationEnd)} sub="Registration closes" />
            <Info icon={UsersIcon} label={`${activeCount}/${tournament.maxParticipants}`} sub="Registered" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="neutral">{tournament.entryFee > 0 ? `Entry Fee ${money(tournament.entryFee)}` : 'Free Entry'}</Badge>
            {tournament.prize && (
              <Badge tone="warning" className="normal-case">
                <Trophy className="mr-1 inline size-3 -mt-0.5" />{tournament.prize}
              </Badge>
            )}
            <span className="text-ink-500">Hosted by <span className="font-medium text-ink-800">{organizer?.name}</span></span>
          </div>

          {tournament.rules && <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">{tournament.rules}</p>}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Registration" />
        <CardBody>
          {!user ? (
            <p className="text-sm text-ink-500">Log in to register for this tournament.</p>
          ) : inviteForMe ? (
            <div className="rounded-lg border border-accent-300 bg-accent-400/10 p-4">
              <p className="text-sm text-ink-700">
                <span className="font-semibold">{store.getUser(inviteForMe.userId)?.name}</span> invited you to team up for this tournament.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" icon={CheckCircle2} onClick={() => handleRespond(true)}>Accept</Button>
                <Button size="sm" variant="outlineDanger" icon={XCircle} onClick={() => handleRespond(false)}>Decline</Button>
              </div>
            </div>
          ) : myActiveReg ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink-800">
                  {myActiveReg.partnerId ? `You & ${store.getUser(myActiveReg.partnerId)?.name}` : 'You are registered'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge status={myActiveReg.status} />
                  {myActiveReg.paymentStatus === 'SUCCESS' && tournament.entryFee > 0 && (
                    <span className="text-xs text-ink-500">Paid {money(tournament.entryFee)}</span>
                  )}
                </div>
              </div>
              {!['COMPLETED', 'CANCELLED'].includes(tournament.status) && (
                <Button size="sm" variant="outlineDanger" icon={LogOut} onClick={() => handleWithdraw(myActiveReg)}>Withdraw</Button>
              )}
            </div>
          ) : canRegister ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500">
                {tournament.category === 'Doubles' ? 'Register solo or invite a partner to team up.' : 'Spots are open — register now.'}
              </p>
              <Button icon={Trophy} onClick={() => (tournament.category === 'Doubles' ? setRegisterOpen(true) : handleQuickRegister())}>
                Register
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-500">
              {tournament.status === 'CANCELLED' ? 'This tournament has been cancelled.'
                : isFull ? 'Registration is full — this tournament has reached capacity.'
                : tournament.status === 'REGISTRATION_OPEN' && deadlinePassed ? 'The registration deadline has passed.'
                : tournament.status === 'DRAFT' ? 'Registration has not opened yet.'
                : 'Registration is closed for this tournament.'}
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader title={`Registered Players & Teams (${confirmedRegistrations.length})`} />
        <CardBody className="space-y-2">
          {confirmedRegistrations.length === 0 ? (
            <p className="text-sm text-ink-400">No confirmed registrations yet.</p>
          ) : (
            confirmedRegistrations.map((r) => {
              const u = store.getUser(r.userId);
              const partner = r.partnerId ? store.getUser(r.partnerId) : null;
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <Avatar name={u?.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">{u?.name}{partner ? ` & ${partner.name}` : ''}</p>
                    {r.teamName && <p className="text-xs text-ink-400">{r.teamName}</p>}
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Fixtures & Bracket" />
        <CardBody>
          {matches.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Fixtures not generated yet"
              message="The bracket will appear here once the organizer generates fixtures from confirmed registrations."
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {roundsPresent.map((round) => (
                <div key={round} className="flex w-56 shrink-0 flex-col gap-3">
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{round}</p>
                  {matches.filter((m) => m.round === round).map((m) => (
                    <MatchCard key={m.id} match={m} store={store} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} tournament={tournament} userId={user?.id} />
    </div>
  );
}

function Info({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 text-ink-400" />
      <div>
        <p className="font-medium text-ink-800">{label}</p>
        {sub && <p className="text-xs text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}

// Round labels come from the fixture generator as 'Final' / 'Semi Final' /
// 'Quarter Final' / 'Round of N'. Rank ascending = earliest round first,
// so columns lay out left (first round) to right (Final).
function roundRank(label) {
  if (label === 'Final') return 0;
  if (label === 'Semi Final') return 1;
  if (label === 'Quarter Final') return 2;
  const match = /Round of (\d+)/.exec(label || '');
  if (match) return Math.log2(Number(match[1])) - 1;
  return 99;
}

function MatchCard({ match, store }) {
  const result = store.resultForMatch(match.id);
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-ink-400">{match.scheduledDate ? `${formatDate(match.scheduledDate)}${match.scheduledTime ? ` · ${formatTime(match.scheduledTime)}` : ''}` : 'TBD'}</span>
        <Badge status={match.status} />
      </div>
      <div className="space-y-1">
        <TeamRow name={match.team1?.name} isWinner={!!result && result.winnerRegId === match.team1?.regId} />
        <TeamRow name={match.team2?.name} isWinner={!!result && result.winnerRegId === match.team2?.regId} />
      </div>
      {result && <p className="mt-2 text-xs font-medium text-ink-600">{result.score}</p>}
    </div>
  );
}

function TeamRow({ name, isWinner }) {
  return (
    <div className={`flex items-center justify-between gap-1 rounded px-2 py-1 ${isWinner ? 'bg-brand-50 font-semibold text-brand-800' : 'text-ink-700'}`}>
      <span className="truncate">{name || 'TBD'}</span>
      {isWinner && <Trophy className="size-3.5 shrink-0 text-brand-600" />}
    </div>
  );
}

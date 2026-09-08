import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users as UsersIcon, Trophy, XCircle, LogOut,
  ClipboardCheck, Pencil, Trash2, UserX, ArrowUpCircle, ShieldCheck, PlayCircle,
  Shield, CheckCircle2, Lock,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { joinGame, leaveGame, cancelGame, deleteGame, promoteFromWaitlist, startGame } from '../../services/gameService';
import { can, PERMISSIONS, ROLES, ROLE_LABELS } from '../../lib/permissions';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/States';
import { formatDate, formatTime, money } from '../../lib/format';
import EnterResultModal from './EnterResultModal';
import EditGameModal from './EditGameModal';

export default function GameDetailPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { toast, askConfirm } = store;

  const game = store.getGame(gameId);
  const players = store.playersForGame(gameId);
  const waitlist = store.waitlistForGame(gameId);
  const result = store.resultForGame(gameId);
  const club = game ? store.getClub(game.clubId) : null;
  const court = game ? store.getCourt(game.courtId) : null;
  const organizer = game ? store.getUser(game.organizerId) : null;
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!game) return <LoadingState label="Loading game…" />;

  const isOrganizer = user?.id === game.organizerId;
  const isAdminViewer = can(user?.role, PERMISSIONS.GAMES_MANAGE) && !isOrganizer;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const myEntry = [...players, ...waitlist].find((p) => p.userId === user?.id);
  const isJoined = !!myEntry;
  const canJoin = ['PUBLISHED', 'OPEN_FOR_JOINING', 'FULL'].includes(game.status) && !isJoined && !isOrganizer && !isAdminViewer;
  const isPast = new Date(`${game.date}T${game.endTime}`) < new Date();
  const isMatchStarted = game.status === 'IN_PROGRESS' || game.status === 'COMPLETED';
  const canEnterResult = (isOrganizer || isAdminViewer) && !result && !['CANCELLED', 'DRAFT'].includes(game.status) && (isPast || game.status === 'IN_PROGRESS');
  const canEdit = (isOrganizer || isAdminViewer) && !['CANCELLED', 'COMPLETED'].includes(game.status);
  const canCancel = (isOrganizer || isAdminViewer) && !['CANCELLED', 'COMPLETED'].includes(game.status);

  // Role permissions for starting match:
  // Player-organizer must have all slots filled. Admins/Managers can force-start anytime.
  const isPlayerOrganizer = isOrganizer && (!user?.role || user?.role === 'PLAYER');
  const canStartMatch = (isOrganizer || isAdminViewer) && ['OPEN_FOR_JOINING', 'FULL'].includes(game.status);
  const canPlayerStart = isPlayerOrganizer ? players.length >= game.maxPlayers : true;

  const isPriceProtected = game.createdByPlayer === true || game.creatorRole === 'PLAYER';

  const handleJoin = () => {
    const r = joinGame(game.id, user.id);
    if (!r.ok) return toast(r.error, 'error');
    toast(r.status === 'WAITLISTED' ? `Added to waitlist at position #${r.position}.` : 'You joined the game!', r.status === 'WAITLISTED' ? 'info' : 'success');
  };

  const handleStartMatch = () => {
    if (isPlayerOrganizer && !canPlayerStart) {
      toast(`All ${game.maxPlayers} players must join before you can start. (Currently ${players.length}/${game.maxPlayers})`, 'error');
      return;
    }
    askConfirm({
      title: 'Start this match now?',
      message: 'Once started, the match will be live. No players can leave or claim refunds after start.',
      confirmLabel: 'Start Match',
      tone: 'brand',
      onConfirm: () => {
        const r = startGame(game.id, user.id);
        if (!r.ok) return toast(r.error, 'error');
        toast('Match is now LIVE! Have a great match.', 'success');
      },
    });
  };

  const handleLeave = () => {
    if (isMatchStarted) {
      toast('Match has already started. Refunds and withdrawals are disabled.', 'error');
      return;
    }
    askConfirm({
      title: 'Leave this game?',
      message: 'Your slot will be released and 100% refund processed before match start.',
      confirmLabel: 'Leave Game',
      tone: 'danger',
      onConfirm: () => {
        const r = leaveGame(game.id, user.id);
        if (!r.ok) return toast(r.error, 'error');
        toast('You left the game and refund was issued.', 'success');
      },
    });
  };

  const handleCancelGame = () => {
    askConfirm({
      title: 'Cancel this match?',
      message: 'All confirmed players will be notified and 100% refunded. This action cannot be undone.',
      confirmLabel: 'Cancel Match',
      tone: 'danger',
      onConfirm: () => {
        const r = cancelGame(game.id, user.id, isAdminViewer);
        if (!r.ok) return toast(r.error, 'error');
        toast('Match cancelled and all players refunded.', 'success');
      },
    });
  };

  const handleDelete = () => {
    askConfirm({
      title: 'Permanently delete this game?',
      message: `This removes "${game.name}" entirely. Any paid players are refunded first.`,
      confirmLabel: 'Delete Permanently',
      tone: 'danger',
      onConfirm: () => {
        const r = deleteGame(game.id, user.id);
        if (!r.ok) return toast(r.error, 'error');
        toast('Game permanently deleted.', 'success');
        navigate('/games');
      },
    });
  };

  const handleRemovePlayer = (p) => {
    const u = store.getUser(p.userId);
    const wasConfirmed = p.status === 'CONFIRMED';
    askConfirm({
      title: `Remove ${u?.name || 'this player'}?`,
      message: wasConfirmed
        ? 'Their slot is released, any payment refunded according to policy, and the next waitlisted player is promoted automatically.'
        : 'They will be removed from the waitlist.',
      confirmLabel: 'Remove',
      tone: 'danger',
      onConfirm: () => {
        const r = leaveGame(game.id, p.userId);
        if (!r.ok) return toast(r.error, 'error');
        toast(`${u?.name || 'Player'} removed.`, 'success');
      },
    });
  };

  const handlePromote = () => {
    const r = promoteFromWaitlist(game.id);
    if (!r.ok) return toast(r.error, 'error');
    toast('Player approved and promoted into the game.', 'success');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 transition-colors">
        <ArrowLeft className="size-4" /> Back to Games
      </button>

      {isAdminViewer && (
        <div className="flex items-center gap-2 rounded-xl border border-court-200 bg-court-50 px-4 py-3 text-sm text-court-800 shadow-sm">
          <ShieldCheck className="size-5 shrink-0 text-court-600" />
          <div>
            <span className="font-semibold">Administrator Oversight Active</span> · You have full match management permissions as {ROLE_LABELS[user?.role] || 'Staff'}.
          </div>
        </div>
      )}

      {/* Hero Match Card with Sports Styling */}
      <Card className="overflow-hidden border border-ink-100 shadow-md">
        <div className="border-b border-ink-100 bg-gradient-to-r from-emerald-950 via-court-900 to-ink-950 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-court-500/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-court-300 border border-court-400/30">
                {game.gameType} · {game.skillLevel}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{game.name}</h1>
            </div>
            <div>
              {game.status === 'IN_PROGRESS' ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1 text-sm font-bold text-red-300 border border-red-500/40 animate-pulse">
                  <span className="size-2.5 rounded-full bg-red-400 animate-ping"></span>
                  MATCH LIVE
                </span>
              ) : (
                <Badge status={game.status} className="px-3 py-1 text-sm font-semibold" />
              )}
            </div>
          </div>
        </div>

        <CardBody className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-ink-600 sm:grid-cols-4">
            <Info icon={MapPin} label={club?.name || 'Club Venue'} sub={court?.name || 'Assigned Court'} />
            <Info icon={Calendar} label={formatDate(game.date)} sub="Date" />
            <Info icon={Clock} label={`${formatTime(game.startTime)} - ${formatTime(game.endTime)}`} sub="Scheduled Time" />
            <Info icon={UsersIcon} label={`${game.currentPlayers}/${game.maxPlayers} Players`} sub="Capacity" />
          </div>

          {game.description && (
            <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-700 leading-relaxed border border-ink-100/60">
              {game.description}
            </p>
          )}

          {/* Role & Transparency Banner */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5 shadow-sm">
              <Avatar name={organizer?.name} size="md" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Match Organizer</p>
                <p className="text-sm font-bold text-ink-900">{organizer?.name || 'Organizing Host'}</p>
                <span className="inline-block mt-0.5 rounded bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200/60">
                  Role: {ROLE_LABELS[organizer?.role] || organizer?.role || 'PLAYER'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Shield className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Data Security & Price</p>
                <p className="text-sm font-bold text-ink-900">
                  {game.entryFee > 0 ? `${money(game.entryFee)} / Player` : 'Free to Join'}
                </p>
                {isPriceProtected ? (
                  <p className="truncate text-[11px] text-emerald-700 font-medium">
                    🔒 Player-created: Price locked against admin alterations
                  </p>
                ) : (
                  <p className="truncate text-[11px] text-ink-500">Official Club / Staff Managed Match</p>
                )}
              </div>
            </div>
          </div>

          {/* Refund Transparency Policy Box */}
          <div className={`rounded-xl border p-4 text-xs sm:text-sm ${isMatchStarted ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
            <div className="flex items-start gap-2.5">
              {isMatchStarted ? (
                <Lock className="size-5 shrink-0 text-amber-700 mt-0.5" />
              ) : (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">
                  {isMatchStarted ? 'Refund Locked (Match Started)' : 'Transparent Cancellation & Refund Security'}
                </p>
                <p className="text-xs opacity-90">
                  {isMatchStarted
                    ? 'This match has started. To ensure tournament and match integrity, player refunds and withdrawals are permanently frozen.'
                    : '100% instantaneous refund guaranteed if you leave before the scheduled start time. Price bounds (₹200–₹2,00,000) are audited for transparency.'}
                </p>
              </div>
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm shadow-sm">
              <p className="flex items-center gap-1.5 font-bold text-brand-800">
                <Trophy className="size-4 text-brand-600" /> Match Result Recorded & Audited
              </p>
              <p className="mt-1 text-brand-700 font-medium">
                Winners: {result.winnerIds.map((id) => store.getUser(id)?.name).join(' & ')} defeated {result.loserIds.map((id) => store.getUser(id)?.name).join(' & ')} — {result.score}
              </p>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {canJoin && (
              <Button size="lg" onClick={handleJoin} className="bg-court-600 hover:bg-court-700 text-white shadow-sm font-semibold">
                {game.status === 'FULL' ? 'Join Waitlist' : `Join Match (${game.entryFee > 0 ? money(game.entryFee) : 'Free'})`}
              </Button>
            )}

            {/* Start Match Button */}
            {canStartMatch && (
              <Button
                size="lg"
                variant="court"
                icon={PlayCircle}
                onClick={handleStartMatch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                Start Match
              </Button>
            )}

            {isJoined && !isOrganizer && !isAdminViewer && myEntry.status !== 'CANCELLED' && (
              <Button
                variant="outlineDanger"
                icon={LogOut}
                onClick={handleLeave}
                disabled={isMatchStarted}
                title={isMatchStarted ? 'Cannot leave after match starts' : 'Leave match'}
              >
                {isMatchStarted ? 'Match Started (Locked)' : 'Leave Game'}
              </Button>
            )}

            {canEdit && <Button variant="secondary" icon={Pencil} onClick={() => setEditModalOpen(true)}>Edit Details</Button>}
            {canCancel && <Button variant="outlineDanger" icon={XCircle} onClick={handleCancelGame}>Cancel Match</Button>}
            {canEnterResult && <Button variant="court" icon={ClipboardCheck} onClick={() => setResultModalOpen(true)}>Enter Result</Button>}
            {isSuperAdmin && (
              <Button variant="outlineDanger" icon={Trash2} onClick={handleDelete}>Delete Permanently</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader title={`Confirmed Players (${players.length})`} />
          <CardBody className="space-y-2">
            {players.map((p) => {
              const u = store.getUser(p.userId);
              const isThisOrganizer = u?.id === game.organizerId;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar name={u?.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">{u?.name}{isThisOrganizer && <span className="ml-1.5 text-xs text-brand-600">(Organizer)</span>}</p>
                    <p className="text-xs text-ink-400">{u?.skillLevel}</p>
                  </div>
                  {game.entryFee > 0 && <Badge status={p.paymentStatus === 'SUCCESS' ? 'SUCCESS' : p.paymentStatus} />}
                  {isAdminViewer && !isThisOrganizer && !['CANCELLED', 'COMPLETED'].includes(game.status) && (
                    <button type="button" onClick={() => handleRemovePlayer(p)} title="Remove player" className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                      <UserX className="size-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={`Waitlist (${waitlist.length})`} />
          <CardBody className="space-y-2">
            {waitlist.length === 0 && <p className="text-sm text-ink-400">No one is waitlisted.</p>}
            {waitlist.map((p, idx) => {
              const u = store.getUser(p.userId);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">{p.waitlistPosition}</span>
                  <Avatar name={u?.name} size="sm" />
                  <p className="flex-1 text-sm font-medium text-ink-800">{u?.name}</p>
                  {isAdminViewer && !['CANCELLED', 'COMPLETED'].includes(game.status) && (
                    <>
                      {idx === 0 && (
                        <Button size="sm" variant="secondary" icon={ArrowUpCircle} onClick={handlePromote}>Approve</Button>
                      )}
                      <button type="button" onClick={() => handleRemovePlayer(p)} title="Reject / remove from waitlist" className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                        <UserX className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <EnterResultModal open={resultModalOpen} onClose={() => setResultModalOpen(false)} game={game} players={players} organizerId={user?.id} />
      {canEdit && <EditGameModal open={editModalOpen} onClose={() => setEditModalOpen(false)} game={game} club={club} court={court} organizerId={user?.id} />}
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

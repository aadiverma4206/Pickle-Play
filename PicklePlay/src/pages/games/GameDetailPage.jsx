import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Clock, Users as UsersIcon, Trophy, XCircle, LogOut,
  ClipboardCheck, Pencil, Trash2, UserX, ArrowUpCircle, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { joinGame, leaveGame, cancelGame, deleteGame, promoteFromWaitlist } from '../../services/gameService';
import { can, PERMISSIONS, ROLES } from '../../lib/permissions';
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
  // A privileged admin (anyone with GAMES_MANAGE — Super Admin, Ops Admin,
  // Club Manager) gets the same oversight controls here as in the admin
  // panel's Manage drawer, even for games they didn't organize — access to
  // "manage a game" shouldn't depend on which screen you happen to be on.
  const isAdminViewer = can(user?.role, PERMISSIONS.GAMES_MANAGE) && !isOrganizer;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const myEntry = [...players, ...waitlist].find((p) => p.userId === user?.id);
  const isJoined = !!myEntry;
  const canJoin = ['PUBLISHED', 'OPEN_FOR_JOINING', 'FULL'].includes(game.status) && !isJoined && !isOrganizer && !isAdminViewer;
  const isPast = new Date(`${game.date}T${game.endTime}`) < new Date();
  const canEnterResult = (isOrganizer || isAdminViewer) && !result && !['CANCELLED', 'DRAFT'].includes(game.status) && (isPast || game.status === 'IN_PROGRESS');
  const canEdit = isOrganizer && !['CANCELLED', 'COMPLETED'].includes(game.status);
  const canCancel = (isOrganizer || isAdminViewer) && !['CANCELLED', 'COMPLETED'].includes(game.status);

  const handleJoin = () => {
    const r = joinGame(game.id, user.id);
    if (!r.ok) return toast(r.error, 'error');
    toast(r.status === 'WAITLISTED' ? `Added to waitlist at position #${r.position}.` : 'You joined the game!', r.status === 'WAITLISTED' ? 'info' : 'success');
  };

  const handleLeave = () => {
    askConfirm({
      title: isOrganizer || isAdminViewer ? 'Cancel this game?' : 'Leave this game?',
      message: isOrganizer || isAdminViewer ? 'All players will be notified and refunded according to policy.' : 'Your slot will be released and any eligible refund processed.',
      confirmLabel: isOrganizer || isAdminViewer ? 'Cancel Game' : 'Leave Game',
      tone: 'danger',
      onConfirm: () => {
        const r = (isOrganizer || isAdminViewer) ? cancelGame(game.id, user.id, isAdminViewer) : leaveGame(game.id, user.id);
        if (!r.ok) return toast(r.error, 'error');
        toast(isOrganizer || isAdminViewer ? 'Game cancelled and players notified.' : 'You left the game.', 'success');
      },
    });
  };

  const handleDelete = () => {
    askConfirm({
      title: 'Permanently delete this game?',
      message: `This removes "${game.name}" entirely — unlike Cancel, this cannot be undone. Any paid players are refunded first.`,
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
        ? 'Their slot is released, any payment refunded according to policy, and the next waitlisted player (if any) is promoted automatically.'
        : 'They will be removed from the waitlist and everyone behind them moves up one position.',
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
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Back
      </button>

      {isAdminViewer && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-court-200 bg-court-50 px-4 py-2.5 text-sm text-court-800">
          <ShieldCheck className="size-4 shrink-0" />
          You're viewing this with admin oversight — you can manage it below even though you didn't organize it.
        </div>
      )}

      <Card>
        <CardHeader
          title={game.name}
          subtitle={`${game.gameType} · ${game.skillLevel}`}
          action={<Badge status={game.status} className="text-sm" />}
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm text-ink-600 sm:grid-cols-4">
            <Info icon={MapPin} label={club?.name} sub={court?.name} />
            <Info icon={Calendar} label={formatDate(game.date)} sub="Date" />
            <Info icon={Clock} label={`${formatTime(game.startTime)} - ${formatTime(game.endTime)}`} sub="Time" />
            <Info icon={UsersIcon} label={`${game.currentPlayers}/${game.maxPlayers}`} sub="Players" />
          </div>

          {game.description && <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">{game.description}</p>}

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge tone="neutral">{game.entryFee > 0 ? `Entry Fee ${money(game.entryFee)}` : 'Free to join'}</Badge>
            <span className="text-ink-500">Organized by <span className="font-medium text-ink-800">{organizer?.name}</span></span>
          </div>

          {result && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-brand-800"><Trophy className="size-4" /> Result recorded</p>
              <p className="mt-1 text-brand-700">Winners: {result.winnerIds.map((id) => store.getUser(id)?.name).join(' & ')} defeated {result.loserIds.map((id) => store.getUser(id)?.name).join(' & ')} — {result.score}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canJoin && <Button onClick={handleJoin}>{game.status === 'FULL' ? 'Join Waitlist' : 'Join Game'}</Button>}
            {isJoined && !isOrganizer && !isAdminViewer && myEntry.status !== 'CANCELLED' && (
              <Button variant="outlineDanger" icon={LogOut} onClick={handleLeave}>Leave Game</Button>
            )}
            {canEdit && <Button variant="secondary" icon={Pencil} onClick={() => setEditModalOpen(true)}>Edit Game</Button>}
            {canCancel && <Button variant="outlineDanger" icon={XCircle} onClick={handleLeave}>Cancel Game</Button>}
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

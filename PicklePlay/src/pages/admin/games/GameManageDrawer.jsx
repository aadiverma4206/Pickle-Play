import { useState } from 'react';
import { Trophy, XCircle, ClipboardCheck, UserX, ArrowUpCircle, Trash2 } from 'lucide-react';
import { useStore } from '../../../store';
import { cancelGame, enterGameResult, leaveGame, promoteFromWaitlist, deleteGame } from '../../../services/gameService';
import { ROLES } from '../../../lib/permissions';
import Drawer from '../../../components/ui/Drawer';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { Input, FormRow, Checkbox } from '../../../components/ui/Field';
import { formatDate, formatTime, money } from '../../../lib/format';

/** Admin-facing companion to GameDetailPage's player list, plus admin-only
 *  overrides (force-cancel, force-enter-result, remove/promote a specific
 *  player, and — Super Admin only — permanent delete) that call the same
 *  services the organizer-facing UI uses, with isAdmin=true so the audit
 *  log fires. `adminRole` gates the Super-Admin-exclusive delete action. */
export default function GameManageDrawer({ gameId, onClose, adminId, adminRole }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [resultMode, setResultMode] = useState(false);
  const [winnerIds, setWinnerIds] = useState([]);
  const [score, setScore] = useState('');
  const [error, setError] = useState('');

  const game = gameId ? store.getGame(gameId) : null;
  const players = game ? store.playersForGame(game.id) : [];
  const waitlist = game ? store.waitlistForGame(game.id) : [];
  const result = game ? store.resultForGame(game.id) : null;
  const club = game ? store.getClub(game.clubId) : null;
  const court = game ? store.getCourt(game.courtId) : null;

  const close = () => { setResultMode(false); setWinnerIds([]); setScore(''); setError(''); onClose(); };

  if (!game) return null;

  const isPast = new Date(`${game.date}T${game.endTime}`) < new Date();
  const canForceResult = !result && !['CANCELLED', 'DRAFT'].includes(game.status) && (isPast || game.status === 'IN_PROGRESS');
  const canCancel = !['CANCELLED', 'COMPLETED'].includes(game.status);

  const toggleWinner = (userId) => {
    setWinnerIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleRemovePlayer = (p) => {
    const u = store.getUser(p.userId);
    const wasConfirmed = p.status === 'CONFIRMED';
    store.askConfirm({
      title: `Remove ${u?.name || 'this player'}?`,
      message: wasConfirmed
        ? 'Their slot is released, any payment refunded according to policy, and the next waitlisted player (if any) is promoted automatically.'
        : 'They will be removed from the waitlist and everyone behind them moves up one position.',
      confirmLabel: 'Remove',
      tone: 'danger',
      onConfirm: () => {
        const r = leaveGame(game.id, p.userId);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${u?.name || 'Player'} removed.`, 'success');
      },
    });
  };

  const handlePromote = (p) => {
    const u = store.getUser(p.userId);
    const r = promoteFromWaitlist(game.id);
    if (!r.ok) return store.toast(r.error, 'error');
    store.toast(`${u?.name || 'Player'} approved and promoted into the game.`, 'success');
  };

  const handleDelete = () => {
    store.askConfirm({
      title: 'Permanently delete this game?',
      message: `This removes "${game.name}" entirely — unlike Cancel, this cannot be undone and the record will no longer appear anywhere. Any paid players are refunded first.`,
      confirmLabel: 'Delete Permanently',
      tone: 'danger',
      onConfirm: () => {
        const r = deleteGame(game.id, adminId);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast('Game permanently deleted.', 'success');
        onClose();
      },
    });
  };

  const handleCancel = () => {
    store.askConfirm({
      title: 'Cancel this game?',
      message: `All ${players.length} confirmed player(s) will be notified and refunded according to policy. This cannot be undone.`,
      confirmLabel: 'Cancel Game',
      tone: 'danger',
      onConfirm: () => {
        const r = cancelGame(game.id, adminId, true);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast('Game cancelled and players notified.', 'success');
      },
    });
  };

  const handleSubmitResult = (e) => {
    e.preventDefault();
    setError('');
    const loserIds = players.map((p) => p.userId).filter((id) => !winnerIds.includes(id));
    if (winnerIds.length === 0 || loserIds.length === 0) { setError('Select at least one winner and one other player as the opponent.'); return; }
    if (!score.trim()) { setError('Enter the set score, e.g. 11-7, 11-9.'); return; }
    const r = enterGameResult(game.id, { winnerIds, loserIds, score: score.trim() }, adminId);
    if (!r.ok) { setError(r.error); return; }
    store.toast('Result recorded — ratings, performance and achievements updated.', 'success');
    setResultMode(false);
    setWinnerIds([]);
    setScore('');
  };

  return (
    <Drawer open={!!gameId} onClose={close} title={game.name} widthClass="max-w-lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge status={game.status} />
          <Badge tone="neutral">{game.gameType}</Badge>
          <Badge tone="neutral">{game.skillLevel}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-ink-600">
          <div><p className="text-xs text-ink-400">Venue</p><p className="font-medium text-ink-800">{club?.name}</p><p className="text-xs text-ink-400">{court?.name}</p></div>
          <div><p className="text-xs text-ink-400">Date / Time</p><p className="font-medium text-ink-800">{formatDate(game.date)}</p><p className="text-xs text-ink-400">{formatTime(game.startTime)}–{formatTime(game.endTime)}</p></div>
          <div><p className="text-xs text-ink-400">Organizer</p><p className="font-medium text-ink-800">{store.getUser(game.organizerId)?.name}</p></div>
          <div><p className="text-xs text-ink-400">Entry Fee</p><p className="font-medium text-ink-800">{game.entryFee > 0 ? money(game.entryFee) : 'Free'}</p></div>
        </div>

        {result && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-brand-800"><Trophy className="size-4" /> Result recorded</p>
            <p className="mt-1 text-brand-700">
              Winners: {result.winnerIds.map((id) => store.getUser(id)?.name).join(' & ')} defeated {result.loserIds.map((id) => store.getUser(id)?.name).join(' & ')} — {result.score}
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-800">Confirmed Players ({players.length})</p>
          <div className="space-y-2">
            {players.length === 0 && <p className="text-sm text-ink-400">No confirmed players.</p>}
            {players.map((p) => {
              const u = store.getUser(p.userId);
              const isOrganizer = u?.id === game.organizerId;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar name={u?.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">{u?.name}{isOrganizer && <span className="ml-1.5 text-xs text-brand-600">(Organizer)</span>}</p>
                    <p className="text-xs text-ink-400">{u?.skillLevel}</p>
                  </div>
                  {game.entryFee > 0 && <Badge status={p.paymentStatus} />}
                  {!isOrganizer && !['CANCELLED', 'COMPLETED'].includes(game.status) && (
                    <button type="button" onClick={() => handleRemovePlayer(p)} title="Remove player" className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                      <UserX className="size-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-800">Waitlist ({waitlist.length})</p>
          <div className="space-y-2">
            {waitlist.length === 0 && <p className="text-sm text-ink-400">No one is waitlisted.</p>}
            {waitlist.map((p, idx) => {
              const u = store.getUser(p.userId);
              const canPromote = idx === 0 && !['CANCELLED', 'COMPLETED'].includes(game.status);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">{p.waitlistPosition}</span>
                  <Avatar name={u?.name} size="sm" />
                  <p className="flex-1 text-sm font-medium text-ink-800">{u?.name}</p>
                  {canPromote && (
                    <Button size="sm" variant="secondary" icon={ArrowUpCircle} onClick={() => handlePromote(p)}>Approve</Button>
                  )}
                  {!['CANCELLED', 'COMPLETED'].includes(game.status) && (
                    <button type="button" onClick={() => handleRemovePlayer(p)} title="Reject / remove from waitlist" className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                      <UserX className="size-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canForceResult && (
          <div className="border-t border-ink-100 pt-4">
            {!resultMode ? (
              players.length >= 2 ? (
                <Button variant="court" icon={ClipboardCheck} onClick={() => setResultMode(true)}>Force Enter Result</Button>
              ) : (
                <p className="text-sm text-ink-400">Not enough confirmed players to record a result.</p>
              )
            ) : (
              <form onSubmit={handleSubmitResult} className="space-y-3">
                <FormRow label="Winning player(s)" help="Everyone else confirmed is recorded as the opposing side.">
                  <div className="space-y-2 rounded-lg border border-ink-200 p-3">
                    {players.map((p) => {
                      const u = store.getUser(p.userId);
                      return <Checkbox key={p.id} label={u?.name} checked={winnerIds.includes(p.userId)} onChange={() => toggleWinner(p.userId)} />;
                    })}
                  </div>
                </FormRow>
                <FormRow label="Score" required help="Set-by-set, e.g. 11-7, 11-9">
                  <Input required value={score} onChange={(e) => setScore(e.target.value)} placeholder="11-7, 11-9" />
                </FormRow>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit">Save Result</Button>
                  <Button type="button" variant="secondary" onClick={() => { setResultMode(false); setError(''); }}>Cancel</Button>
                </div>
              </form>
            )}
          </div>
        )}

        {(canCancel || adminRole === ROLES.SUPER_ADMIN) && (
          <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            {canCancel && <Button variant="outlineDanger" icon={XCircle} onClick={handleCancel}>Cancel Game</Button>}
            {adminRole === ROLES.SUPER_ADMIN && (
              <Button variant="outlineDanger" icon={Trash2} onClick={handleDelete}>Delete Permanently</Button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

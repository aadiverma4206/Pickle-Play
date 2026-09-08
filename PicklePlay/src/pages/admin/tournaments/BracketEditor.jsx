import { useState } from 'react';
import { Trophy, ClipboardCheck } from 'lucide-react';
import { enterMatchResult } from '../../../services/tournamentService';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { Input, FormRow } from '../../../components/ui/Field';
import { EmptyState } from '../../../components/ui/States';
import { formatDate, formatTime } from '../../../lib/format';

// Round labels come from the fixture generator as 'Final' / 'Semi Final' /
// 'Quarter Final' / 'Round of N'. Sorting by descending rank puts the
// earliest round first and the Final last, so columns lay out left (first
// round) to right (Final) — mirrors the player TournamentDetailPage bracket view.
function roundRank(label) {
  if (label === 'Final') return 0;
  if (label === 'Semi Final') return 1;
  if (label === 'Quarter Final') return 2;
  const match = /Round of (\d+)/.exec(label || '');
  if (match) return Math.log2(Number(match[1])) - 1;
  return 99;
}

/** Renders the tournament bracket grouped into round columns, with an
 *  "Enter Result" action on any match whose two teams are set and which has
 *  no recorded result yet. Saving propagates the winner into the next round
 *  slot via tournamentService, and the bracket re-renders from the store. */
export default function BracketEditor({ matches, store, adminId }) {
  const [activeMatch, setActiveMatch] = useState(null);

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Fixtures not generated yet"
        message="Close registration and generate fixtures to build the bracket."
      />
    );
  }

  // Descending rank = earliest round first, Final last — left-to-right bracket flow.
  const roundsPresent = [...new Set(matches.map((m) => m.round))].sort((a, b) => roundRank(b) - roundRank(a));

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {roundsPresent.map((round) => (
          <div key={round} className="flex w-60 shrink-0 flex-col gap-3">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{round}</p>
            {matches.filter((m) => m.round === round).map((m) => (
              <MatchCard key={m.id} match={m} store={store} onEnterResult={() => setActiveMatch(m)} />
            ))}
          </div>
        ))}
      </div>

      <EnterResultModal
        open={!!activeMatch}
        match={activeMatch}
        store={store}
        adminId={adminId}
        onClose={() => setActiveMatch(null)}
      />
    </>
  );
}

function MatchCard({ match, store, onEnterResult }) {
  const result = store.resultForMatch(match.id);
  const canEnter = !!match.team1 && !!match.team2 && !result && !['WALKOVER', 'CANCELLED'].includes(match.status);
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-ink-400">
          {match.scheduledDate ? `${formatDate(match.scheduledDate)}${match.scheduledTime ? ` · ${formatTime(match.scheduledTime)}` : ''}` : 'TBD'}
        </span>
        <Badge status={match.status} />
      </div>
      <div className="space-y-1">
        <TeamRow name={match.team1?.name} isWinner={!!result && result.winnerRegId === match.team1?.regId} />
        <TeamRow name={match.team2?.name} isWinner={!!result && result.winnerRegId === match.team2?.regId} />
      </div>
      {result && <p className="mt-2 text-xs font-medium text-ink-600">{result.score}</p>}
      {canEnter && (
        <Button size="sm" variant="court" icon={ClipboardCheck} className="mt-3 w-full" onClick={onEnterResult}>
          Enter Result
        </Button>
      )}
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

function EnterResultModal({ open, match, store, adminId, onClose }) {
  const [winnerSide, setWinnerSide] = useState(1);
  const [score, setScore] = useState('');
  const [error, setError] = useState('');
  const [resetKey, setResetKey] = useState(null);

  // Reset the form whenever a different match opens for entry — adjusted
  // directly during render (React's recommended pattern) rather than in an
  // effect, so it doesn't cost an extra render pass.
  const currentKey = open ? match?.id ?? 'open' : null;
  if (currentKey !== resetKey) {
    setResetKey(currentKey);
    if (currentKey) { setWinnerSide(1); setScore(''); setError(''); }
  }

  if (!match) return null;

  const handleSubmit = () => {
    if (!score.trim()) { setError('Enter the match score, e.g. 11-7, 11-9.'); return; }
    const r = enterMatchResult(match.id, { winnerSide, score: score.trim() }, adminId);
    if (!r.ok) { setError(r.error); return; }
    store.toast('Result recorded — the bracket has been updated.', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enter Result — ${match.round}`}
      subtitle={`${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'}`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Result</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <FormRow label="Winner" required>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWinnerSide(1)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${winnerSide === 1 ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-700 hover:border-ink-300'}`}
            >
              {match.team1?.name || 'TBD'}
            </button>
            <button
              type="button"
              onClick={() => setWinnerSide(2)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${winnerSide === 2 ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-700 hover:border-ink-300'}`}
            >
              {match.team2?.name || 'TBD'}
            </button>
          </div>
        </FormRow>
        <FormRow label="Score" required help="Comma-separate sets, e.g. 11-7, 9-11, 11-8.">
          <Input value={score} onChange={(e) => { setScore(e.target.value); if (error) setError(''); }} placeholder="11-7, 11-9" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

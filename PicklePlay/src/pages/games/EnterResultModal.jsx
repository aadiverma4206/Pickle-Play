import { useState } from 'react';
import { useStore } from '../../store';
import { enterGameResult } from '../../services/gameService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, FormRow, Checkbox } from '../../components/ui/Field';

export default function EnterResultModal({ open, onClose, game, players, organizerId }) {
  const toast = useStore((s) => s.toast);
  const [winnerIds, setWinnerIds] = useState([]);
  const [score, setScore] = useState('');
  const [error, setError] = useState('');

  const toggleWinner = (userId) => {
    setWinnerIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const loserIds = players.map((p) => p.userId).filter((id) => !winnerIds.includes(id));
    if (winnerIds.length === 0 || loserIds.length === 0) { setError('Select at least one winner and one other player as the opponent.'); return; }
    if (!score.trim()) { setError('Enter the set score, e.g. 11-7, 11-9.'); return; }
    const result = enterGameResult(game.id, { winnerIds, loserIds, score: score.trim() }, organizerId);
    if (!result.ok) { setError(result.error); return; }
    toast('Result recorded — ratings, performance and achievements updated.', 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Enter Match Result" subtitle="Select the winning side and the final score." size="md"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Result</Button>
      </>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Winning player(s)" help="Everyone else confirmed in the game is recorded as the opposing side.">
          <div className="space-y-2 rounded-lg border border-ink-200 p-3">
            {players.map((p) => {
              const u = useStore.getState().getUser(p.userId);
              return <Checkbox key={p.id} label={u?.name} checked={winnerIds.includes(p.userId)} onChange={() => toggleWinner(p.userId)} />;
            })}
          </div>
        </FormRow>
        <FormRow label="Score" required help="Set-by-set, e.g. 11-7, 9-11, 11-6">
          <Input required value={score} onChange={(e) => setScore(e.target.value)} placeholder="11-7, 11-9" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

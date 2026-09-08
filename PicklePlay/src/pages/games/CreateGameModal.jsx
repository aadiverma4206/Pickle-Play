import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { createGame } from '../../services/gameService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, FormRow, Checkbox } from '../../components/ui/Field';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const GAME_TYPES = ['Singles', 'Doubles', 'Mixed Doubles', 'Open Play', 'Friendly', 'Competitive'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export default function CreateGameModal({ open, onClose, onCreated }) {
  const user = useCurrentUser();
  const allClubs = useStore((s) => s.clubs);
  const courts = useStore((s) => s.courts);
  const toast = useStore((s) => s.toast);
  const clubs = useMemo(() => allClubs.filter((c) => c.status === 'ACTIVE'), [allClubs]);
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: '', clubId: '', courtId: '', date: today, startTime: '18:00', endTime: '19:00',
    gameType: 'Doubles', skillLevel: 'Intermediate', maxPlayers: 4, entryFee: 0, isPrivate: false, description: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableCourts = useMemo(() => courts.filter((c) => c.clubId === form.clubId && c.status === 'AVAILABLE'), [courts, form.clubId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.clubId || !form.courtId) { setError('Please select a club and court.'); return; }
    if (form.startTime >= form.endTime) { setError('End time must be after start time.'); return; }
    setSubmitting(true);
    setTimeout(() => {
      const result = createGame(user.id, { ...form, maxPlayers: Number(form.maxPlayers), entryFee: Number(form.entryFee) });
      setSubmitting(false);
      if (!result.ok) { setError(result.error); return; }
      toast(`"${result.game.name}" is live and open for joining!`, 'success');
      onClose();
      // Admin usage (see AdminGamesPage) passes onCreated to stay in the
      // admin panel instead of jumping to the player-facing game page.
      if (onCreated) onCreated(result.game);
      else navigate(`/games/${result.game.id}`);
    }, 250);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a Game" subtitle="Set up a game and invite players to join." size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Publish Game</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Game Name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Evening Doubles Fun" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Club" required>
            <Select required value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value, courtId: '' })}>
              <option value="">Select club</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Court" required>
            <Select required value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })} disabled={!form.clubId}>
              <option value="">Select court</option>
              {availableCourts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.indoorOutdoor})</option>)}
            </Select>
          </FormRow>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormRow label="Date" required>
            <Input type="date" required min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </FormRow>
          <FormRow label="Start Time" required>
            <Input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </FormRow>
          <FormRow label="End Time" required>
            <Input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Game Type">
            <Select value={form.gameType} onChange={(e) => setForm({ ...form, gameType: e.target.value })}>
              {GAME_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Skill Level">
            <Select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
              {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Maximum Players">
            <Input type="number" min={2} max={16} value={form.maxPlayers} onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })} />
          </FormRow>
          <FormRow label="Entry Fee (₹)">
            <Input type="number" min={0} value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} />
          </FormRow>
        </div>
        <FormRow label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any details players should know…" />
        </FormRow>
        <Checkbox label="Make this a private game (invite only)" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

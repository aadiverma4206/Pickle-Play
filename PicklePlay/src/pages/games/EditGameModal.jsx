import { useState } from 'react';
import { useStore } from '../../store';
import { updateGameDetails } from '../../services/gameService';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, FormRow, Checkbox } from '../../components/ui/Field';

const GAME_TYPES = ['Singles', 'Doubles', 'Mixed Doubles', 'Open Play', 'Friendly', 'Competitive'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export default function EditGameModal({ open, onClose, game, club, court, organizerId }) {
  const toast = useStore((s) => s.toast);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(() => ({
    name: game.name, date: game.date, startTime: game.startTime, endTime: game.endTime,
    gameType: game.gameType, skillLevel: game.skillLevel, maxPlayers: game.maxPlayers,
    entryFee: game.entryFee, isPrivate: game.isPrivate, description: game.description || '',
  }));
  const [wasOpen, setWasOpen] = useState(open);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Re-sync the form with the latest game data every time the modal opens,
  // adjusted directly during render (no effect) per this codebase's convention.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({
        name: game.name, date: game.date, startTime: game.startTime, endTime: game.endTime,
        gameType: game.gameType, skillLevel: game.skillLevel, maxPlayers: game.maxPlayers,
        entryFee: game.entryFee, isPrivate: game.isPrivate, description: game.description || '',
      });
      setError('');
    }
  }

  const currentUser = useCurrentUser();
  const isOriginallyCreatedByPlayer = game.createdByPlayer === true || game.creatorRole === 'PLAYER';
  const isPlayerOrganizer = currentUser?.id === game.organizerId && (!currentUser?.role || currentUser?.role === 'PLAYER');
  const isPriceLocked = isOriginallyCreatedByPlayer && !isPlayerOrganizer;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Please enter a game name.'); return; }
    if (Number(form.maxPlayers) < game.currentPlayers) { setError(`Maximum players can't be less than the ${game.currentPlayers} already confirmed.`); return; }
    if (form.startTime >= form.endTime) { setError('End time must be after start time.'); return; }

    const fee = Number(form.entryFee) || 0;
    if (fee > 0 && (fee < 200 || fee > 200000)) {
      setError('Entry fee must be between ₹200 and ₹2,00,000 (or ₹0 for free games).');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const result = updateGameDetails(game.id, {
        name: form.name.trim(), date: form.date, startTime: form.startTime, endTime: form.endTime,
        gameType: form.gameType, skillLevel: form.skillLevel, maxPlayers: Number(form.maxPlayers),
        entryFee: isPriceLocked ? game.entryFee : fee, isPrivate: form.isPrivate, description: form.description.trim(),
      }, organizerId || currentUser?.id);
      setSubmitting(false);
      if (!result.ok) { setError(result.error); return; }
      toast('Game details updated.', 'success');
      onClose();
    }, 200);
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Game" subtitle="Venue can't be changed once players have joined." size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Save Changes</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Venue">
          <Input disabled value={`${club?.name || '—'} · ${court?.name || '—'}`} />
        </FormRow>
        <FormRow label="Game Name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormRow>
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
          <FormRow label="Maximum Players" help={`${game.currentPlayers} player(s) already confirmed.`}>
            <Input type="number" min={game.currentPlayers || 2} max={16} value={form.maxPlayers} onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })} />
          </FormRow>
          <FormRow
            label="Entry Fee (₹)"
            help={
              isPriceLocked
                ? '🔒 Price is protected because this match was created by a player. Admins and Managers cannot modify it.'
                : 'Free play is ₹0. Paid matches must be ₹200 to ₹2,00,000.'
            }
          >
            <Input
              type="number"
              min={0}
              max={200000}
              disabled={isPriceLocked}
              value={form.entryFee}
              onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
            />
          </FormRow>
        </div>
        <FormRow label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormRow>
        <Checkbox label="Private game (invite only)" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { registerForTournament } from '../../services/tournamentService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Select, FormRow } from '../../components/ui/Field';
import { money } from '../../lib/format';

// Handles registration for both Singles (direct confirm) and Doubles
// (partner picker → TEAM_PENDING invite) categories in one place, per the
// tournamentService.registerForTournament(tournamentId, userId, {partnerId})
// contract. Any other category behaves like Singles (no partner flow),
// matching the service's `category === 'Doubles'` check.
export default function RegisterModal({ open, onClose, tournament, userId }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const isDoubles = tournament?.category === 'Doubles';

  const eligiblePartners = useMemo(() => {
    if (!tournament || !isDoubles || !open) return [];
    return store.users
      .filter((u) => u.id !== userId && u.role === 'PLAYER' && u.status === 'ACTIVE' && !store.isUserRegistered(tournament.id, u.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [store, tournament, isDoubles, userId, open]);

  const [partnerId, setPartnerId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!tournament) return null;

  const handleClose = () => {
    setPartnerId('');
    setError('');
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = () => {
    setError('');
    if (isDoubles && !partnerId) { setError('Please select a partner to team up with.'); return; }
    setSubmitting(true);
    const result = registerForTournament(tournament.id, userId, isDoubles ? { partnerId } : {});
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    if (result.status === 'TEAM_PENDING') {
      store.toast('Invite sent! Your registration will be confirmed once your partner accepts.', 'info');
    } else {
      store.toast(`You're registered for ${tournament.name}!`, 'success');
    }
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Register for ${tournament.name}`}
      subtitle={isDoubles ? 'Pick a partner to team up with.' : 'Confirm your registration details.'}
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>{isDoubles ? 'Send Invite' : 'Confirm Registration'}</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-ink-50 p-3 text-sm">
          <div>
            <p className="text-ink-500">Category</p>
            <p className="font-medium text-ink-800">{tournament.category}</p>
          </div>
          <div>
            <p className="text-ink-500">Entry Fee</p>
            <p className="font-medium text-ink-800">{tournament.entryFee > 0 ? money(tournament.entryFee) : 'Free'}</p>
          </div>
        </div>

        {isDoubles ? (
          <FormRow
            label="Partner"
            required
            help="Your partner will receive an invite and your team is confirmed once they accept."
          >
            <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">Select a partner</option>
              {eligiblePartners.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.skillLevel}</option>)}
            </Select>
          </FormRow>
        ) : (
          <p className="text-sm text-ink-600">
            You're about to register as a solo player for <strong>{tournament.name}</strong>.
            {tournament.entryFee > 0 && ` A payment of ${money(tournament.entryFee)} will be processed to confirm your spot.`}
          </p>
        )}

        {isDoubles && eligiblePartners.length === 0 && (
          <p className="text-xs text-accent-600">No eligible partners found right now — everyone else may already be registered.</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

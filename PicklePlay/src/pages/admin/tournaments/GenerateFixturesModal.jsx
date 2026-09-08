import { useEffect, useState } from 'react';
import { generateFixtures } from '../../../services/tournamentService';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Select, FormRow } from '../../../components/ui/Field';

/** Lets the admin pick the venue court fixtures will be scheduled on (or
 *  auto-select the club's first court), then builds the full knockout
 *  bracket from CONFIRMED registrations via tournamentService. */
export default function GenerateFixturesModal({ open, onClose, tournament, registrations, minParticipants, adminId, store }) {
  const [courtId, setCourtId] = useState('');
  const venueCourts = tournament ? store.courtsForClub(tournament.venueClubId) : [];
  const confirmedCount = registrations.filter((r) => r.status === 'CONFIRMED').length;

  useEffect(() => {
    if (open) setCourtId(venueCourts[0]?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tournament?.id]);

  if (!tournament) return null;

  const handleGenerate = () => {
    const r = generateFixtures(tournament.id, adminId, { courtId: courtId || undefined });
    if (!r.ok) { store.toast(r.error, 'error'); return; }
    store.toast('Fixtures generated — the bracket is ready.', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Fixtures"
      subtitle={`Build the knockout bracket for ${tournament.name} from confirmed registrations.`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Bracket</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-600">
          {confirmedCount} confirmed {confirmedCount === 1 ? 'entry' : 'entries'} · minimum {minParticipants} required.
        </p>
        {confirmedCount < minParticipants && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Not enough confirmed registrations yet — you can still try, but fixture generation will be blocked until at least {minParticipants} are confirmed.
          </p>
        )}
        <FormRow label="Venue Court" help="Matches will be scheduled on this court by default.">
          <Select value={courtId} onChange={(e) => setCourtId(e.target.value)}>
            <option value="">Auto-select first available court</option>
            {venueCourts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.indoorOutdoor})</option>)}
          </Select>
        </FormRow>
      </div>
    </Modal>
  );
}

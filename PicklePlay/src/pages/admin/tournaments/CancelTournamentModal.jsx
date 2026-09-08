import { useState } from 'react';
import { cancelTournament } from '../../../services/tournamentService';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Textarea, FormRow } from '../../../components/ui/Field';

/** Cancelling a tournament is audit-logged and refunds every paid
 *  registration automatically (Section 29), so we always capture a reason
 *  rather than a bare confirm dialog — mirrors SuspendUserModal. */
export default function CancelTournamentModal({ open, tournament, adminId, store, onClose }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const confirm = () => {
    if (!reason.trim()) { setError('Please provide a reason for cancelling this tournament.'); return; }
    const r = cancelTournament(tournament.id, adminId, reason.trim());
    if (!r.ok) { store.toast(r.error, 'error'); return; }
    store.toast(`${tournament.name} has been cancelled and refunds issued.`, 'success');
    handleClose();
  };

  return (
    <Modal
      open={open && !!tournament}
      onClose={handleClose}
      title={`Cancel ${tournament?.name || ''}`}
      subtitle="Every confirmed registration will be withdrawn and any successful payment fully refunded. This cannot be undone."
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Keep Tournament</Button>
          <Button variant="danger" onClick={confirm}>Cancel Tournament</Button>
        </>
      )}
    >
      <FormRow label="Reason for cancellation" required error={error}>
        <Textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
          placeholder="e.g. Venue became unavailable due to maintenance."
        />
      </FormRow>
    </Modal>
  );
}

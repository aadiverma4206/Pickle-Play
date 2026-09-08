import { useState } from 'react';
import { useStore } from '../../../store';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Textarea, FormRow } from '../../../components/ui/Field';

/** Shared suspend-with-reason modal used by both the Users list and the
 *  User 360° detail page — suspending is audit-logged (Section 40), so we
 *  always capture a reason rather than a bare confirm dialog. */
export default function SuspendUserModal({ open, user, actingUserId, onClose }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const confirm = () => {
    if (!reason.trim()) { setError('Please provide a reason for this action.'); return; }
    const r = store.setUserStatus(user.id, 'SUSPENDED', actingUserId, reason.trim());
    if (!r.ok) { store.toast(r.error, 'error'); return; }
    store.toast(`${user.name} has been suspended.`, 'success');
    handleClose();
  };

  return (
    <Modal
      open={open && !!user}
      onClose={handleClose}
      title={`Suspend ${user?.name || ''}`}
      subtitle="This user will be immediately signed out and unable to log back in until reactivated."
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={confirm}>Suspend User</Button>
        </>
      )}
    >
      <FormRow label="Reason for suspension" required error={error}>
        <Textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
          placeholder="e.g. Repeated no-shows reported by multiple organizers."
        />
      </FormRow>
    </Modal>
  );
}

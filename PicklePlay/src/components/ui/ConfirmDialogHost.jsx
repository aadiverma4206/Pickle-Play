import { useStore } from '../../store';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialogHost() {
  const dialog = useStore((s) => s.confirmDialog);
  const closeConfirm = useStore((s) => s.closeConfirm);

  if (!dialog) return null;

  const handleConfirm = async () => {
    await dialog.onConfirm?.();
    closeConfirm();
  };

  return (
    <Modal open onClose={closeConfirm} title={dialog.title} subtitle={dialog.message} size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={closeConfirm}>{dialog.cancelLabel || 'Cancel'}</Button>
          <Button variant={dialog.tone === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm}>{dialog.confirmLabel || 'Confirm'}</Button>
        </>
      )}
    >
      {dialog.body}
    </Modal>
  );
}

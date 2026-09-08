import { useState } from 'react';
import { useStore } from '../../../store';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Input, FormRow } from '../../../components/ui/Field';

/** Mount this with `key={court?.id}` from the parent so the form re-initializes
 *  fresh whenever a different court is targeted for editing. */
export default function EditCourtPricingModal({ open, onClose, court, adminId }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [form, setForm] = useState({
    base: court?.pricing?.base ?? 0,
    peakMultiplier: court?.pricing?.peakMultiplier ?? 1.5,
    weekendMultiplier: court?.pricing?.weekendMultiplier ?? 1.75,
  });
  const [error, setError] = useState('');

  if (!court) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const base = Number(form.base);
    const peak = Number(form.peakMultiplier);
    const weekend = Number(form.weekendMultiplier);
    if (!base || base <= 0) { setError('Base price must be greater than 0.'); return; }
    if (!peak || peak < 1) { setError('Peak multiplier must be at least 1.'); return; }
    if (!weekend || weekend < 1) { setError('Weekend multiplier must be at least 1.'); return; }
    store.updateCourt(court.id, { pricing: { ...court.pricing, base, peakMultiplier: peak, weekendMultiplier: weekend } }, adminId);
    store.toast(`Pricing updated for ${court.name}.`, 'success');
    onClose();
  };

  return (
    <Modal
      open={open} onClose={onClose} title={`Edit Pricing — ${court.name}`} subtitle="Changes apply to all future bookings on this court." size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Pricing</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Base Price (₹ / hour)" required>
          <Input required type="number" min={1} value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Peak Multiplier" required help="Applied during peak hours">
            <Input required type="number" min={1} step={0.05} value={form.peakMultiplier} onChange={(e) => setForm({ ...form, peakMultiplier: e.target.value })} />
          </FormRow>
          <FormRow label="Weekend Multiplier" required help="Applied on Sat / Sun">
            <Input required type="number" min={1} step={0.05} value={form.weekendMultiplier} onChange={(e) => setForm({ ...form, weekendMultiplier: e.target.value })} />
          </FormRow>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

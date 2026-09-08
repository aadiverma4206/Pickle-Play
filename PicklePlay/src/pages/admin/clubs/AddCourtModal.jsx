import { useState } from 'react';
import { useStore } from '../../../store';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Input, Select, FormRow } from '../../../components/ui/Field';

const emptyForm = { name: '', number: '', indoorOutdoor: 'Indoor', surface: 'Acrylic', base: 400 };

export default function AddCourtModal({ open, onClose, clubId, adminId }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const close = () => { setForm(emptyForm); setError(''); onClose(); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.number || Number(form.number) <= 0) {
      setError('Enter a court name and a valid court number.');
      return;
    }
    if (!form.base || Number(form.base) <= 0) {
      setError('Enter a valid base price per hour.');
      return;
    }
    store.addCourt(clubId, {
      name: form.name.trim(),
      number: Number(form.number),
      indoorOutdoor: form.indoorOutdoor,
      surface: form.surface.trim() || 'Acrylic',
      pricing: { base: Number(form.base), peakMultiplier: 1.5, weekendMultiplier: 1.75, peakWindows: [{ start: '17:00', end: '21:00' }] },
    }, adminId);
    store.toast(`${form.name} added to the club.`, 'success');
    close();
  };

  return (
    <Modal
      open={open} onClose={close} title="Add Court" subtitle="New courts are available for booking immediately." size="md"
      footer={(
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Court</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Court Name" required>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Court 4" />
          </FormRow>
          <FormRow label="Court Number" required>
            <Input required type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Indoor / Outdoor">
            <Select value={form.indoorOutdoor} onChange={(e) => setForm({ ...form, indoorOutdoor: e.target.value })}>
              <option>Indoor</option>
              <option>Outdoor</option>
            </Select>
          </FormRow>
          <FormRow label="Surface">
            <Input value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="Acrylic" />
          </FormRow>
        </div>
        <FormRow label="Base Price (₹ / hour)" required help="Peak (×1.5) and weekend (×1.75) multipliers apply automatically and can be adjusted later.">
          <Input required type="number" min={1} value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Input, Textarea, FormRow, Checkbox } from '../../../components/ui/Field';

const emptyForm = { name: '', address: '', city: '', contact: '', openingHours: '06:00 - 22:00', facilities: '', description: '', managerIds: [] };

export default function CreateClubModal({ open, onClose, adminId }) {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const navigate = useNavigate();

  const managers = store.users.filter((u) => u.role === 'CLUB_MANAGER' && u.status === 'ACTIVE');

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleManager = (id) => {
    setForm((f) => ({ ...f, managerIds: f.managerIds.includes(id) ? f.managerIds.filter((m) => m !== id) : [...f.managerIds, id] }));
  };

  const close = () => { setForm(emptyForm); setError(''); onClose(); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.contact.trim() || !form.openingHours.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const club = store.createClub({
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contact: form.contact.trim(),
      openingHours: form.openingHours.trim(),
      facilities: form.facilities.split(',').map((s) => s.trim()).filter(Boolean),
      description: form.description.trim(),
      managerIds: form.managerIds,
    }, adminId);
    setSubmitting(false);
    store.toast(`"${club.name}" created and pending approval.`, 'success');
    close();
    navigate(`/admin/clubs/${club.id}`);
  };

  return (
    <Modal
      open={open} onClose={close} title="Create Club" subtitle="New clubs start as Pending until approved." size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Club</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Club Name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Smash Point Pickleball Club" />
        </FormRow>
        <FormRow label="Address" required>
          <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area, landmark" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="City" required>
            <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bengaluru" />
          </FormRow>
          <FormRow label="Contact Number" required>
            <Input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="080-4000-1000" />
          </FormRow>
        </div>
        <FormRow label="Opening Hours" required help="e.g. 06:00 - 22:00">
          <Input required value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
        </FormRow>
        <FormRow label="Facilities" help="Comma-separated, e.g. Parking, Washroom, Pro Shop">
          <Input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} placeholder="Parking, Washroom, Floodlights" />
        </FormRow>
        <FormRow label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description shown to players…" />
        </FormRow>
        {managers.length > 0 && (
          <FormRow label="Assign Manager(s)" help="Optional — can also be assigned later from the club's detail page.">
            <div className="space-y-2 rounded-lg border border-ink-200 p-3">
              {managers.map((m) => (
                <Checkbox key={m.id} label={`${m.name}${m.city ? ` (${m.city})` : ''}`} checked={form.managerIds.includes(m.id)} onChange={() => toggleManager(m.id)} />
              ))}
            </div>
          </FormRow>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

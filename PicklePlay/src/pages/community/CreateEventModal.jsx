import { useState } from 'react';
import { useStore } from '../../store';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Textarea, FormRow } from '../../components/ui/Field';

const INITIAL = { name: '', description: '', location: '', date: '', startTime: '18:00', maxParticipants: 16, entryFee: 0 };

export default function CreateEventModal({ open, onClose, communityId, organizerId }) {
  const store = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');

  const handleClose = () => {
    setForm(INITIAL);
    setError('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Please enter an event name.'); return; }
    if (!form.location.trim()) { setError('Please enter a location.'); return; }
    if (!form.date) { setError('Please choose a date.'); return; }
    const maxParticipants = Number(form.maxParticipants);
    if (!maxParticipants || maxParticipants < 1) { setError('Maximum participants must be at least 1.'); return; }

    const event = store.createEventRecord({
      communityId,
      organizerId,
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      date: form.date,
      startTime: form.startTime,
      maxParticipants,
      entryFee: Number(form.entryFee) || 0,
    });
    store.toast(`"${event.name}" scheduled and open for registration.`, 'success');
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Community Event"
      subtitle="Schedule a meetup, tournament or open-play session for members."
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Event</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Event Name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Community Doubles Night" />
        </FormRow>
        <FormRow label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What should members expect?" />
        </FormRow>
        <FormRow label="Location" required>
          <Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Club or address" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Date" required>
            <Input type="date" required min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </FormRow>
          <FormRow label="Start Time" required>
            <Input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Maximum Participants" required>
            <Input type="number" min={1} value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
          </FormRow>
          <FormRow label="Entry Fee (₹)">
            <Input type="number" min={0} value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} />
          </FormRow>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

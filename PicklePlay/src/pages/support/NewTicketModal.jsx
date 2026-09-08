import { useState } from 'react';
import { useStore } from '../../store';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Select, Input, Textarea, FormRow } from '../../components/ui/Field';

const CATEGORIES = ['Payment', 'Booking', 'Game', 'Tournament', 'Club', 'Player', 'Community', 'Technical'];

export default function NewTicketModal({ open, onClose, userId }) {
  const toast = useStore((s) => s.toast);
  const createTicket = useStore((s) => s.createTicket);

  const [form, setForm] = useState({ category: '', subject: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setForm({ category: '', subject: '', description: '' }); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please select a category.');
    if (!form.subject.trim()) return setError('Please enter a subject.');
    if (!form.description.trim()) return setError('Please describe your issue.');

    setSubmitting(true);
    setTimeout(() => {
      createTicket({ userId, category: form.category, subject: form.subject.trim(), description: form.description.trim() });
      setSubmitting(false);
      toast('Your support ticket has been submitted.', 'success');
      handleClose();
    }, 200);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Raise a Support Ticket"
      subtitle="Tell us what's wrong — our team will get back to you here."
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Submit Ticket</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Category" required>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormRow>
        <FormRow label="Subject" required>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Short summary of the issue" maxLength={120} />
        </FormRow>
        <FormRow label="Description" required help="Include as much detail as possible so we can help faster.">
          <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened, when, and what you expected instead…" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

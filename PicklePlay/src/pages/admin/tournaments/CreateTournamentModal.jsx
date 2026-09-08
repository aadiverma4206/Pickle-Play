import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Input, Select, Textarea, FormRow } from '../../../components/ui/Field';

const CATEGORIES = ['Singles', 'Doubles'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const FORMATS = ['Knockout', 'Round Robin', 'Group + Knockout'];

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  name: '', venueClubId: '', startDate: today(), endDate: today(),
  registrationStart: today(), registrationEnd: today(),
  entryFee: 0, minParticipants: 4, maxParticipants: 16,
  category: 'Doubles', skillLevel: 'Intermediate', format: 'Knockout',
  prize: '', rules: '',
});

export default function CreateTournamentModal({ open, onClose }) {
  const admin = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const navigate = useNavigate();

  const activeClubs = useMemo(() => store.clubs.filter((c) => c.status === 'ACTIVE'), [store.clubs]);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleClose = () => {
    setForm(emptyForm());
    setError('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter a tournament name.');
    if (!form.venueClubId) return setError('Please select a venue club.');
    if (!form.startDate || !form.endDate) return setError('Please set both start and end dates.');
    if (form.endDate < form.startDate) return setError('End date must be on or after the start date.');
    if (!form.registrationStart || !form.registrationEnd) return setError('Please set the registration window.');
    if (form.registrationEnd < form.registrationStart) return setError('Registration end must be on or after registration start.');
    if (form.registrationEnd > form.startDate) return setError('Registration must close on or before the tournament start date.');
    const min = Number(form.minParticipants);
    const max = Number(form.maxParticipants);
    if (!Number.isFinite(min) || min < 2) return setError('Minimum participants must be at least 2.');
    if (!Number.isFinite(max) || max < min) return setError('Maximum participants must be greater than or equal to the minimum.');
    if (Number(form.entryFee) < 0) return setError('Entry fee cannot be negative.');

    setSubmitting(true);
    setTimeout(() => {
      const tournament = store.createTournamentRecord({
        ...form,
        name: form.name.trim(),
        prize: form.prize.trim(),
        rules: form.rules.trim(),
        minParticipants: min,
        maxParticipants: max,
        entryFee: Number(form.entryFee),
        organizerId: admin.id,
        status: 'DRAFT',
      });
      const r = store.transitionTournament(tournament.id, 'REGISTRATION_OPEN');
      setSubmitting(false);
      if (!r.ok) { setError(r.error); return; }
      store.toast(`"${tournament.name}" is live and open for registration!`, 'success');
      handleClose();
      navigate(`/admin/tournaments/${tournament.id}`);
    }, 250);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create a Tournament"
      subtitle="Publishing opens registration immediately."
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Publish Tournament</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Tournament Name" required>
          <Input required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="City Open 2026" />
        </FormRow>

        <FormRow label="Venue Club" required>
          <Select required value={form.venueClubId} onChange={(e) => set({ venueClubId: e.target.value })}>
            <option value="">Select club</option>
            {activeClubs.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.city}</option>)}
          </Select>
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Start Date" required>
            <Input type="date" required value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </FormRow>
          <FormRow label="End Date" required>
            <Input type="date" required min={form.startDate} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Registration Opens" required>
            <Input type="date" required value={form.registrationStart} onChange={(e) => set({ registrationStart: e.target.value })} />
          </FormRow>
          <FormRow label="Registration Closes" required help="Must be on or before the start date.">
            <Input type="date" required max={form.startDate} value={form.registrationEnd} onChange={(e) => set({ registrationEnd: e.target.value })} />
          </FormRow>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormRow label="Category">
            <Select value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Skill Level">
            <Select value={form.skillLevel} onChange={(e) => set({ skillLevel: e.target.value })}>
              {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Format">
            <Select value={form.format} onChange={(e) => set({ format: e.target.value })}>
              {FORMATS.map((f) => <option key={f}>{f}</option>)}
            </Select>
          </FormRow>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormRow label="Min Participants">
            <Input type="number" min={2} value={form.minParticipants} onChange={(e) => set({ minParticipants: e.target.value })} />
          </FormRow>
          <FormRow label="Max Participants">
            <Input type="number" min={2} value={form.maxParticipants} onChange={(e) => set({ maxParticipants: e.target.value })} />
          </FormRow>
          <FormRow label="Entry Fee (₹)">
            <Input type="number" min={0} value={form.entryFee} onChange={(e) => set({ entryFee: e.target.value })} />
          </FormRow>
        </div>

        <FormRow label="Prize" help="Optional — shown to players on the tournament page.">
          <Input value={form.prize} onChange={(e) => set({ prize: e.target.value })} placeholder="₹25,000 Prize Pool" />
        </FormRow>

        <FormRow label="Rules">
          <Textarea value={form.rules} onChange={(e) => set({ rules: e.target.value })} placeholder="Standard USAPA rules apply." />
        </FormRow>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

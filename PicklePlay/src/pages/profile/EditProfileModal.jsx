import { useState } from 'react';
import { useStore } from '../../store';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, FormRow } from '../../components/ui/Field';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad'];

const emptyForm = (user) => ({
  name: user?.name || '',
  city: user?.city || '',
  area: user?.area || '',
  dob: user?.dob || '',
  gender: user?.gender || 'Male',
  skillLevel: user?.skillLevel || 'Beginner',
  playingHand: user?.playingHand || 'Right',
  bio: user?.bio || '',
});

export default function EditProfileModal({ open, onClose, user }) {
  const updateUser = useStore((s) => s.updateUser);
  const toast = useStore((s) => s.toast);
  const [form, setForm] = useState(() => emptyForm(user));
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Re-seed the form with a fresh snapshot every time the modal transitions
  // from closed to open, so stale edits from a previous open don't linger.
  // Adjusted directly during render (React's recommended pattern) rather
  // than in an effect, so it doesn't cost an extra render pass.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(emptyForm(user));
      setError('');
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.city.trim()) { setError('City is required.'); return; }
    updateUser(user.id, {
      name: form.name.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      dob: form.dob,
      gender: form.gender,
      skillLevel: form.skillLevel,
      playingHand: form.playingHand,
      bio: form.bio,
    });
    toast('Profile updated successfully.', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      subtitle="Update your details so other players know you better."
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Full Name" required>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormRow>
          <FormRow label="City" required>
            <Select required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Area / Locality">
            <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Indiranagar" />
          </FormRow>
          <FormRow label="Date of Birth">
            <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </FormRow>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Gender">
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Male</option><option>Female</option><option>Other</option>
            </Select>
          </FormRow>
          <FormRow label="Playing Hand">
            <Select value={form.playingHand} onChange={(e) => setForm({ ...form, playingHand: e.target.value })}>
              <option>Right</option><option>Left</option>
            </Select>
          </FormRow>
        </div>
        <FormRow label="Skill Level">
          <Select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
            {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </FormRow>
        <FormRow label="Bio">
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell other players a bit about yourself…" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, FormRow, Toggle } from '../../components/ui/Field';

const SKILL_LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Intermediate+', 'Advanced', 'Professional'];

const INITIAL = { name: '', description: '', location: '', skillLevel: 'All Levels', isPrivate: false, maxMembers: 100 };

export default function CreateCommunityModal({ open, onClose, onCreated }) {
  const user = useCurrentUser();
  const store = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setForm(INITIAL);
    setError('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Please enter a community name.'); return; }
    if (!form.location.trim()) { setError('Please enter a location.'); return; }
    const maxMembers = Number(form.maxMembers);
    if (!maxMembers || maxMembers < 2) { setError('Maximum members must be at least 2.'); return; }

    setSubmitting(true);
    const community = store.createCommunityRecord({
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      skillLevel: form.skillLevel,
      isPrivate: form.isPrivate,
      maxMembers,
      ownerId: user.id,
      coverImage: null,
      rules: '',
    });
    setSubmitting(false);
    store.toast(`"${community.name}" is live!`, 'success');
    handleClose();
    // Admin usage (see AdminCommunitiesPage) passes onCreated to stay in the
    // admin panel instead of jumping to the player-facing community page.
    if (onCreated) onCreated(community);
    else navigate(`/community/${community.id}`);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create a Community"
      subtitle="Bring players together around a city, skill level or vibe."
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Community</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Community Name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sunrise Dinkers Club" />
        </FormRow>
        <FormRow label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this community about?" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Location" required>
            <Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" />
          </FormRow>
          <FormRow label="Skill Level">
            <Select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
              {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormRow>
        </div>
        <FormRow label="Maximum Members" required>
          <Input type="number" min={2} value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} />
        </FormRow>
        <Toggle
          checked={form.isPrivate}
          onChange={(val) => setForm({ ...form, isPrivate: val })}
          label={form.isPrivate ? 'Private — new members must be approved' : 'Public — anyone can join instantly'}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

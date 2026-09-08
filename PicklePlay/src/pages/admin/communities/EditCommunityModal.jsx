import { useState } from 'react';
import { useStore } from '../../../store';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Input, Select, Textarea, FormRow, Toggle } from '../../../components/ui/Field';

const SKILL_LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Intermediate+', 'Advanced', 'Professional'];

export default function EditCommunityModal({ community, onClose, adminId }) {
  const updateCommunity = useStore((s) => s.updateCommunity);
  const logAudit = useStore((s) => s.logAudit);
  const toast = useStore((s) => s.toast);
  const [form, setForm] = useState(() => (community ? {
    name: community.name, description: community.description || '', location: community.location,
    skillLevel: community.skillLevel, isPrivate: community.isPrivate, maxMembers: community.maxMembers,
  } : null));
  const [error, setError] = useState('');

  if (!community || !form) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Please enter a community name.'); return; }
    if (!form.location.trim()) { setError('Please enter a location.'); return; }
    const maxMembers = Number(form.maxMembers);
    if (!maxMembers || maxMembers < 2) { setError('Maximum members must be at least 2.'); return; }

    updateCommunity(community.id, {
      name: form.name.trim(), description: form.description.trim(), location: form.location.trim(),
      skillLevel: form.skillLevel, isPrivate: form.isPrivate, maxMembers,
    });
    logAudit(adminId, 'COMMUNITY_UPDATED', 'Community', community.id, community.name, form.name.trim());
    toast(`"${form.name.trim()}" updated.`, 'success');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Edit Community" subtitle={community.name} size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Community Name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormRow>
        <FormRow label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Location" required>
            <Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
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

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, FormRow } from '../../components/ui/Field';
import AuthLayout from './AuthLayout';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export default function ProfileSetupPage() {
  const user = useCurrentUser();
  const completeProfileSetup = useStore((s) => s.completeProfileSetup);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const [form, setForm] = useState({ area: '', dob: '', gender: 'Male', skillLevel: 'Beginner', playingHand: 'Right', bio: '' });

  if (!user) return <Navigate to="/login" replace />;
  if (user.profileComplete) return <Navigate to="/home" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    completeProfileSetup(form);
    toast('Profile complete — welcome to PicklePlay!', 'success');
    navigate('/home', { replace: true });
  };

  return (
    <AuthLayout title="Set up your profile" subtitle="Help us match you with the right games and players.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" className="w-full" icon={ArrowRight}>Finish Setup</Button>
      </form>
    </AuthLayout>
  );
}

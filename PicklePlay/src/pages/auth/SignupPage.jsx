import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Button from '../../components/ui/Button';
import { Input, FormRow } from '../../components/ui/Field';
import AuthLayout from './AuthLayout';

export default function SignupPage() {
  const currentUser = useCurrentUser();
  const signup = useStore((s) => s.signup);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (currentUser) return <Navigate to="/home" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = signup(form);
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      toast('Account created! Let\'s finish your profile.', 'success');
      navigate('/profile-setup', { replace: true });
    }, 300);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join the community and start playing pickleball.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Full Name">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
        </FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Mobile">
            <Input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="98765 43210" />
          </FormRow>
          <FormRow label="City">
            <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bengaluru" />
          </FormRow>
        </div>
        <FormRow label="Email">
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@mail.com" />
        </FormRow>
        <FormRow label="Password" help="At least 6 characters.">
          <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" icon={UserPlus} loading={loading}>Create Account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}

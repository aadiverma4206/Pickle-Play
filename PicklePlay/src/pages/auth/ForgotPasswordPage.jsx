import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store';
import Button from '../../components/ui/Button';
import { Input, FormRow } from '../../components/ui/Field';
import AuthLayout from './AuthLayout';

export default function ForgotPasswordPage() {
  const users = useStore((s) => s.users);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!exists) { setError('No account found with this email.'); return; }
    setError('');
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10 text-brand-600" />
          <p className="text-sm text-ink-600">A password reset simulation link has been sent to <span className="font-medium">{email}</span>. (Prototype — no real email is sent.)</p>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline">Back to Login</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email and we'll simulate a reset link.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" icon={Send}>Send Reset Link</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}

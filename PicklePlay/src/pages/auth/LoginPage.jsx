import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Input, FormRow } from '../../components/ui/Field';
import { ROLES, ROLE_LABELS, isAdminRole } from '../../lib/permissions';
import AuthLayout from './AuthLayout';

const DEMO_PASSWORD = 'Password@123';

// Only these roles are offered as one-click demo logins — Ops Admin, Finance
// Admin, Community Admin and Moderator accounts are intentionally left off;
// per the platform's access model those roles are assigned/managed by Super
// Admin (see Roles & Permissions), not something to casually log into.
const DEMO_LOGIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.CLUB_MANAGER, ROLES.PLAYER];
const MAX_PLAYERS_SHOWN = 5;

// '/home' and '/login' are never meaningful "return to where I was" targets
// (everyone lands on /home by default, and /login redirecting to itself
// would be a bug) — only honor a genuine deep link a guard redirected from,
// e.g. someone hit /admin/finance while logged out.
function resolveDestination(locationState, role) {
  const from = locationState?.from?.pathname;
  const roleFallback = isAdminRole(role) ? '/admin' : '/home';
  if (from && from !== '/home' && from !== '/login') return from;
  return roleFallback;
}

export default function LoginPage() {
  const currentUser = useCurrentUser();
  const login = useStore((s) => s.login);
  const users = useStore((s) => s.users); // raw array — safe to select directly
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'amit1@mail.com', password: 'Password@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (currentUser) return <Navigate to={resolveDestination(location.state, currentUser.role)} replace />;

  const grouped = users.reduce((acc, u) => {
    if (!DEMO_LOGIN_ROLES.includes(u.role)) return acc;
    (acc[u.role] ||= []).push(u);
    return acc;
  }, {});
  if (grouped[ROLES.PLAYER]) grouped[ROLES.PLAYER] = grouped[ROLES.PLAYER].slice(0, MAX_PLAYERS_SHOWN);

  const fillCredentials = (u) => {
    setForm({ email: u.email, password: DEMO_PASSWORD });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(form.email.trim(), form.password);
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      toast(`Welcome back, ${result.user.name.split(' ')[0]}!`, 'success');
      navigate(resolveDestination(location.state, result.user.role), { replace: true });
    }, 300);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to find games, book courts, and track your rating.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Email">
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@mail.com" />
        </FormRow>
        <FormRow label="Password">
          <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </FormRow>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" icon={LogIn} loading={loading}>Log In</Button>
      </form>
      <div className="mt-5 overflow-hidden rounded-lg border border-ink-200">
        <p className="border-b border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-600">
          Quick demo login — click a name to fill the form, then press <span className="font-medium">Log In</span>. Every demo account uses <span className="font-mono font-medium">{DEMO_PASSWORD}</span>.
        </p>
        <div className="max-h-56 space-y-2.5 overflow-y-auto p-2.5">
          {Object.entries(grouped).map(([role, list]) => (
            <div key={role}>
              <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{ROLE_LABELS[role] || role}</p>
              <div className="flex flex-wrap gap-1.5">
                {list.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => fillCredentials(u)}
                    className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Avatar name={u.name} size="xs" /> {u.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-ink-500">
        New here? <Link to="/signup" className="font-medium text-brand-600 hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

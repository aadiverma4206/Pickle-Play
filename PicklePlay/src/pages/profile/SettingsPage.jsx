import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, RotateCcw } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROLE_LABELS } from '../../lib/permissions';
import SectionHeader from '../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Field';
import { LoadingState } from '../../components/ui/States';

const NOTIFICATION_PREFS = [
  { key: 'games', label: 'Game invites & updates', hint: 'Join confirmations, waitlist promotions and cancellations.' },
  { key: 'bookings', label: 'Court bookings', hint: 'Booking confirmations, reminders and refund status.' },
  { key: 'tournaments', label: 'Tournaments', hint: 'Registration status, fixtures and results.' },
  { key: 'community', label: 'Community activity', hint: 'Posts, events and membership updates.' },
  { key: 'achievements', label: 'Achievements & ratings', hint: 'New badges earned and rating changes.' },
];

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { toast, askConfirm, logout, resetToSeed } = store;

  const [prefs, setPrefs] = useState(() => Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.key, true])));
  const [saving, setSaving] = useState(false);

  if (!user) return <LoadingState label="Loading settings…" />;

  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSavePrefs = () => {
    setSaving(true);
    // Prototype-only: there's no per-category notification preference in the
    // data model, so this just simulates a save round-trip in local state.
    setTimeout(() => {
      setSaving(false);
      toast('Notification preferences saved.', 'success');
    }, 200);
  };

  const handleReset = () => {
    askConfirm({
      title: 'Reset all demo data?',
      message: "This erases every local change you've made — games, bookings, tournaments, community posts, everything — and restores the original seed data. This cannot be undone.",
      confirmLabel: 'Reset Demo Data',
      tone: 'danger',
      onConfirm: () => {
        resetToSeed();
        toast('Demo data has been reset.', 'success');
        navigate('/home');
      },
    });
  };

  const handleLogout = () => {
    askConfirm({
      title: 'Log out?',
      message: 'You will need to sign in again to access your account.',
      confirmLabel: 'Log Out',
      onConfirm: () => {
        logout();
        navigate('/login');
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader title="Settings" subtitle="Manage your account, notifications and app preferences." />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Account"
            subtitle="Your basic account information."
            action={<Link to="/profile" className="text-sm font-medium text-brand-600 hover:underline">Edit in Profile</Link>}
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Full Name" value={user.name} />
            <InfoRow label="Role" value={ROLE_LABELS[user.role] || user.role} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Mobile" value={user.mobile} />
            <InfoRow label="City" value={user.city || '—'} />
            <InfoRow label="Skill Level" value={user.skillLevel || '—'} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notifications" subtitle="Choose what you want to be notified about." />
          <CardBody className="space-y-4">
            {NOTIFICATION_PREFS.map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-800">{p.label}</p>
                  <p className="text-xs text-ink-500">{p.hint}</p>
                </div>
                <Toggle checked={prefs[p.key]} onChange={() => togglePref(p.key)} />
              </div>
            ))}
            <div className="flex justify-end border-t border-ink-100 pt-4">
              <Button size="sm" loading={saving} onClick={handleSavePrefs}>Save Preferences</Button>
            </div>
          </CardBody>
        </Card>

        <Card className="border-red-200">
          <CardHeader title="Danger Zone" subtitle="Irreversible actions — proceed with caution." />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-red-700"><RotateCcw className="size-4" /> Reset Demo Data</p>
                <p className="mt-0.5 text-xs text-red-600">Wipes all local changes and restores the original seed data for this prototype.</p>
              </div>
              <Button variant="outlineDanger" icon={RotateCcw} onClick={handleReset}>Reset Demo Data</Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink-800"><LogOut className="size-4" /> Log Out</p>
                <p className="mt-0.5 text-xs text-ink-500">Sign out of your account on this device.</p>
              </div>
              <Button variant="secondary" icon={LogOut} onClick={handleLogout}>Log Out</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

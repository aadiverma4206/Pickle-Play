import { useState } from 'react';
import { Settings2, CalendarClock, Gamepad2, Trophy, TrendingUp, Landmark, Plus, Trash2, Save } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../../lib/permissions';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Input, FormRow, Toggle, Select } from '../../../components/ui/Field';
import { EmptyState } from '../../../components/ui/States';

function RefundRulesEditor({ rules, onChange }) {
  const update = (idx, patch) => onChange(rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx) => onChange(rules.filter((_, i) => i !== idx));
  const add = () => onChange([...rules, { minHours: 0, percent: 0 }]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium uppercase tracking-wide text-ink-400">
        <span>Cancel this far ahead (hours)</span>
        <span>Refund %</span>
        <span />
      </div>
      {rules.map((rule, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <Input type="number" min={0} value={rule.minHours} onChange={(e) => update(idx, { minHours: Number(e.target.value) })} />
          <Input type="number" min={0} max={100} value={rule.percent} onChange={(e) => update(idx, { percent: Number(e.target.value) })} />
          <button type="button" onClick={() => remove(idx)} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={add}>Add Rule</Button>
      <p className="text-xs text-ink-400">Rules are matched by the highest "hours ahead" threshold the cancellation still qualifies for — keep them ordered from most generous to least.</p>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, subtitle, children, onSave, saving }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={<Icon className="size-5 text-ink-300" />} />
      <CardBody className="space-y-4">
        {children}
        <div className="flex justify-end border-t border-ink-100 pt-4">
          <Button size="sm" icon={Save} loading={saving} onClick={onSave}>Save Changes</Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const admin = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { settings, updateSettings, toast } = store;

  const [booking, setBooking] = useState(settings?.booking || {});
  const [games, setGames] = useState(settings?.games || {});
  const [tournament, setTournament] = useState(settings?.tournament || {});
  const [rating, setRating] = useState(settings?.rating || {});
  const [platform, setPlatform] = useState(settings?.platform || {});
  const [savingSection, setSavingSection] = useState(null);

  if (!settings) return <EmptyState icon={Settings2} title="Settings unavailable" />;
  const canManage = can(admin?.role, PERMISSIONS.SETTINGS_MANAGE);

  const saveSection = (key, value) => {
    setSavingSection(key);
    setTimeout(() => {
      updateSettings(key, value, admin.id);
      setSavingSection(null);
      toast(`${key[0].toUpperCase()}${key.slice(1)} settings saved.`, 'success');
    }, 200);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeader
        title="Settings"
        subtitle="Platform-wide business rules — booking, games, tournaments, rating and finance all read these values instead of hardcoded rules."
      />

      {!canManage && (
        <div className="mb-5 rounded-lg border border-accent-400/40 bg-accent-400/10 px-4 py-3 text-sm text-accent-700">
          You have read access to Settings but only Super Admin can save changes.
        </div>
      )}

      <div className="space-y-6">
        <SettingsSection icon={CalendarClock} title="Booking" subtitle="Advance booking, cancellations and payment timeouts." onSave={() => saveSection('booking', booking)} saving={savingSection === 'booking'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Max Advance Booking (days)">
              <Input type="number" min={1} disabled={!canManage} value={booking.maxAdvanceBookingDays ?? ''} onChange={(e) => setBooking({ ...booking, maxAdvanceBookingDays: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Cancellation Window (hours)" help="Used as a reference point alongside the refund rules below.">
              <Input type="number" min={0} disabled={!canManage} value={booking.cancellationWindowHours ?? ''} onChange={(e) => setBooking({ ...booking, cancellationWindowHours: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Payment Timeout (minutes)" help="How long a HOLD slot waits for payment before release.">
              <Input type="number" min={1} disabled={!canManage} value={booking.paymentTimeoutMinutes ?? ''} onChange={(e) => setBooking({ ...booking, paymentTimeoutMinutes: Number(e.target.value) })} />
            </FormRow>
          </div>
          <FormRow label="Refund Rules">
            <RefundRulesEditor rules={booking.refundRules || []} onChange={(rules) => setBooking({ ...booking, refundRules: rules })} />
          </FormRow>
        </SettingsSection>

        <SettingsSection icon={Gamepad2} title="Games" subtitle="Player limits, duration and waitlist behavior." onSave={() => saveSection('games', games)} saving={savingSection === 'games'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Minimum Players">
              <Input type="number" min={1} disabled={!canManage} value={games.minPlayers ?? ''} onChange={(e) => setGames({ ...games, minPlayers: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Maximum Players">
              <Input type="number" min={1} disabled={!canManage} value={games.maxPlayers ?? ''} onChange={(e) => setGames({ ...games, maxPlayers: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Default Duration (minutes)">
              <Input type="number" min={15} step={15} disabled={!canManage} value={games.defaultDurationMinutes ?? ''} onChange={(e) => setGames({ ...games, defaultDurationMinutes: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Waitlist Promotion Timeout (minutes)">
              <Input type="number" min={1} disabled={!canManage} value={games.waitlistPromotionTimeoutMinutes ?? ''} onChange={(e) => setGames({ ...games, waitlistPromotionTimeoutMinutes: Number(e.target.value) })} />
            </FormRow>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-800">Waitlist Enabled</p>
              <p className="text-xs text-ink-500">Allow players to join a waitlist once a game reaches capacity.</p>
            </div>
            <Toggle checked={!!games.waitlistEnabled} onChange={(v) => canManage && setGames({ ...games, waitlistEnabled: v })} />
          </div>
        </SettingsSection>

        <SettingsSection icon={Trophy} title="Tournament" subtitle="Participant limits and withdrawal refund policy." onSave={() => saveSection('tournament', tournament)} saving={savingSection === 'tournament'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Minimum Participants" help="Required before fixtures can be generated.">
              <Input type="number" min={2} disabled={!canManage} value={tournament.minParticipants ?? ''} onChange={(e) => setTournament({ ...tournament, minParticipants: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Maximum Participants">
              <Input type="number" min={2} disabled={!canManage} value={tournament.maxParticipants ?? ''} onChange={(e) => setTournament({ ...tournament, maxParticipants: Number(e.target.value) })} />
            </FormRow>
          </div>
          <FormRow label="Withdrawal Refund Rules">
            <RefundRulesEditor rules={tournament.withdrawalRefundRules || []} onChange={(rules) => setTournament({ ...tournament, withdrawalRefundRules: rules })} />
          </FormRow>
        </SettingsSection>

        <SettingsSection icon={TrendingUp} title="Rating" subtitle="Skill rating calculation and admin override policy." onSave={() => saveSection('rating', rating)} saving={savingSection === 'rating'}>
          <FormRow label="Elo K-Factor" help="Higher values make each match swing rating more sharply.">
            <Input type="number" min={4} max={64} disabled={!canManage} value={rating.kFactor ?? ''} onChange={(e) => setRating({ ...rating, kFactor: Number(e.target.value) })} />
          </FormRow>
          <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-800">Allow Manual Rating Adjustment</p>
              <p className="text-xs text-ink-500">Lets authorized admins override a player's skill rating (always audit-logged).</p>
            </div>
            <Toggle checked={!!rating.allowManualAdjustment} onChange={(v) => canManage && setRating({ ...rating, allowManualAdjustment: v })} />
          </div>
        </SettingsSection>

        <SettingsSection icon={Landmark} title="Platform" subtitle="Commission, currency and global notification switch." onSave={() => saveSection('platform', platform)} saving={savingSection === 'platform'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Commission (%)" help="Applied to booking/game revenue — see Finance for the live split.">
              <Input type="number" min={0} max={100} disabled={!canManage} value={platform.commissionPercent ?? ''} onChange={(e) => setPlatform({ ...platform, commissionPercent: Number(e.target.value) })} />
            </FormRow>
            <FormRow label="Currency">
              <Select disabled={!canManage} value={platform.currency || 'INR'} onChange={(e) => setPlatform({ ...platform, currency: e.target.value })}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </Select>
            </FormRow>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink-800">Notifications Enabled</p>
              <p className="text-xs text-ink-500">Global kill-switch for in-app notification generation.</p>
            </div>
            <Toggle checked={!!platform.notificationsEnabled} onChange={(v) => canManage && setPlatform({ ...platform, notificationsEnabled: v })} />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

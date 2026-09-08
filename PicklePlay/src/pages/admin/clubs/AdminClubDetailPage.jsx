import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, PlusCircle, CheckCircle2, Ban, XCircle, RotateCcw, Wallet, MapPin, Phone, Clock,
} from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import StatCard from '../../../components/ui/StatCard';
import { Input, Textarea, FormRow } from '../../../components/ui/Field';
import { ErrorState } from '../../../components/ui/States';
import { formatDate, formatTime, money } from '../../../lib/format';
import AddCourtModal from './AddCourtModal';
import EditCourtPricingModal from './EditCourtPricingModal';

const COURT_STATUS_OPTIONS = ['AVAILABLE', 'MAINTENANCE', 'BLOCKED'];

function makeFormState(club) {
  return {
    name: club?.name || '',
    address: club?.address || '',
    city: club?.city || '',
    contact: club?.contact || '',
    openingHours: club?.openingHours || '',
    facilities: (club?.facilities || []).join(', '),
    description: club?.description || '',
  };
}

function BackLink({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
      <ArrowLeft className="size-4" /> Back to Clubs
    </button>
  );
}

export default function AdminClubDetailPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const club = store.getClub(clubId);
  const courts = club ? store.courtsForClub(club.id) : [];

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => makeFormState(club));
  const [formError, setFormError] = useState('');
  const [addCourtOpen, setAddCourtOpen] = useState(false);
  const [pricingTarget, setPricingTarget] = useState(null);

  if (!club) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/admin/clubs')} />
        <ErrorState title="Club not found" message="This club may have been removed or the link is incorrect." />
      </div>
    );
  }

  const canManageAllClubs = can(user?.role, PERMISSIONS.CLUBS_MANAGE);
  const canManageOwnClub = can(user?.role, PERMISSIONS.CLUBS_MANAGE_OWN) && (club.managerIds || []).includes(user?.id);
  const hasClubsAccess = canManageAllClubs || can(user?.role, PERMISSIONS.CLUBS_MANAGE_OWN);

  if (!hasClubsAccess) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/admin/clubs')} />
        <ErrorState title="Access denied" message="You do not have permission to view club details." />
      </div>
    );
  }
  if (!canManageAllClubs && !canManageOwnClub) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/admin/clubs')} />
        <ErrorState title="Access denied" message="You are not assigned as a manager of this club." />
      </div>
    );
  }

  const canEditClub = canManageAllClubs || canManageOwnClub;
  const canManageCourtsFull = can(user?.role, PERMISSIONS.COURTS_MANAGE);
  const canManageCourtsOwn = can(user?.role, PERMISSIONS.COURTS_MANAGE_OWN) && (club.managerIds || []).includes(user?.id);
  const canManageCourts = canManageCourtsFull || canManageCourtsOwn;

  const startEdit = () => { setForm(makeFormState(club)); setFormError(''); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setFormError(''); };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.contact.trim() || !form.openingHours.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    store.updateClub(club.id, {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contact: form.contact.trim(),
      openingHours: form.openingHours.trim(),
      facilities: form.facilities.split(',').map((s) => s.trim()).filter(Boolean),
      description: form.description.trim(),
    }, user.id);
    store.toast('Club details updated.', 'success');
    setEditing(false);
  };

  const handleClubStatusChange = (toStatus, tone) => {
    const messages = {
      ACTIVE: `${club.name} will be visible and bookable across the platform.`,
      SUSPENDED: `${club.name} will be hidden from players and its courts made unbookable until reactivated.`,
      CLOSED: `${club.name} will be permanently closed. This cannot be easily undone.`,
    };
    const labels = { ACTIVE: 'Approve', SUSPENDED: 'Suspend', CLOSED: 'Close Club' };
    store.askConfirm({
      title: `${toStatus === 'ACTIVE' ? 'Approve' : toStatus === 'SUSPENDED' ? 'Suspend' : 'Close'} ${club.name}?`,
      message: messages[toStatus],
      confirmLabel: labels[toStatus],
      tone,
      onConfirm: () => {
        const r = store.setClubStatus(club.id, toStatus, user.id);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${club.name} is now ${toStatus.toLowerCase()}.`, 'success');
      },
    });
  };

  const handleCourtStatusChange = (court, toStatus) => {
    store.askConfirm({
      title: `Set ${court.name} to ${toStatus.toLowerCase()}?`,
      message: toStatus === 'AVAILABLE'
        ? `${court.name} will become bookable again immediately.`
        : `${court.name} will be taken offline immediately. This does not auto-cancel existing bookings — coordinate with affected players first.`,
      confirmLabel: 'Confirm',
      tone: toStatus === 'AVAILABLE' ? undefined : 'danger',
      onConfirm: () => {
        const r = store.setCourtStatus(court.id, toStatus, user.id);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${court.name} is now ${toStatus.toLowerCase()}.`, 'success');
      },
    });
  };

  // ---- Revenue summary (Spec Section 41): SUCCESS payments tied to this
  // club's bookings and games, computed fresh from live data on every render.
  const clubBookingIds = store.bookings.filter((b) => b.clubId === club.id).map((b) => b.id);
  const clubGameIds = store.games.filter((g) => g.clubId === club.id).map((g) => g.id);
  const bookingRevenue = store.payments
    .filter((p) => p.status === 'SUCCESS' && p.referenceType === 'BOOKING' && clubBookingIds.includes(p.referenceId))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const gameRevenue = store.payments
    .filter((p) => p.status === 'SUCCESS' && p.referenceType === 'GAME' && clubGameIds.includes(p.referenceId))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const recentBookings = store.bookings.filter((b) => b.clubId === club.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const recentGames = store.games.filter((g) => g.clubId === club.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const courtColumns = [
    { key: 'name', header: 'Court', render: (c) => (<div><p className="font-medium text-ink-900">{c.name}</p><p className="text-xs text-ink-400">#{c.number}</p></div>) },
    { key: 'type', header: 'Type', render: (c) => `${c.indoorOutdoor} · ${c.surface}` },
    { key: 'base', header: 'Base Rate', render: (c) => `${money(c.pricing?.base)}/hr` },
    { key: 'peak', header: 'Peak', render: (c) => `×${c.pricing?.peakMultiplier}` },
    { key: 'weekend', header: 'Weekend', render: (c) => `×${c.pricing?.weekendMultiplier}` },
    { key: 'status', header: 'Status', render: (c) => <Badge status={c.status} /> },
    ...(canManageCourts
      ? [{
          key: 'actions',
          header: '',
          render: (c) => (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setPricingTarget(c)}>Pricing</Button>
              <select
                key={c.status}
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  e.target.value = '';
                  if (val) handleCourtStatusChange(c, val);
                }}
                className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-700 focus:border-brand-400 focus:outline-none"
              >
                <option value="">Change status…</option>
                {COURT_STATUS_OPTIONS.filter((s) => s !== c.status).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <BackLink onClick={() => navigate('/admin/clubs')} />

      <Card>
        <CardHeader
          title={club.name}
          subtitle={`${club.city} · Added ${formatDate(club.createdAt)}`}
          action={(
            <div className="flex items-center gap-2">
              <Badge status={club.status} className="text-sm" />
              {canEditClub && !editing && <Button size="sm" variant="secondary" icon={Pencil} onClick={startEdit}>Edit</Button>}
            </div>
          )}
        />
        <CardBody className="space-y-4">
          {editing ? (
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Club Name" required>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FormRow>
                <FormRow label="City" required>
                  <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </FormRow>
              </div>
              <FormRow label="Address" required>
                <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </FormRow>
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Contact Number" required>
                  <Input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                </FormRow>
                <FormRow label="Opening Hours" required>
                  <Input required value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
                </FormRow>
              </div>
              <FormRow label="Facilities" help="Comma-separated">
                <Input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} />
              </FormRow>
              <FormRow label="Description">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </FormRow>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm text-ink-600 sm:grid-cols-4">
                <Info icon={MapPin} label={club.address} sub="Address" />
                <Info icon={Phone} label={club.contact} sub="Contact" />
                <Info icon={Clock} label={club.openingHours} sub="Opening Hours" />
                <Info icon={Wallet} label={money(bookingRevenue + gameRevenue)} sub="Total Revenue" />
              </div>
              {club.description && <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">{club.description}</p>}
              {(club.facilities || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {club.facilities.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}
                </div>
              )}
            </>
          )}

          {canManageAllClubs && !editing && (
            <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              {club.status === 'PENDING' && <Button size="sm" icon={CheckCircle2} onClick={() => handleClubStatusChange('ACTIVE')}>Approve Club</Button>}
              {club.status === 'ACTIVE' && <Button size="sm" variant="outlineDanger" icon={Ban} onClick={() => handleClubStatusChange('SUSPENDED', 'danger')}>Suspend Club</Button>}
              {club.status === 'SUSPENDED' && <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => handleClubStatusChange('ACTIVE')}>Reactivate Club</Button>}
              {club.status !== 'CLOSED' && <Button size="sm" variant="outlineDanger" icon={XCircle} onClick={() => handleClubStatusChange('CLOSED', 'danger')}>Close Club</Button>}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Total Revenue" value={money(bookingRevenue + gameRevenue)} tone="brand" />
        <StatCard icon={Wallet} label="Booking Revenue" value={money(bookingRevenue)} hint={`${clubBookingIds.length} bookings`} tone="court" />
        <StatCard icon={Wallet} label="Game Entry Revenue" value={money(gameRevenue)} hint={`${clubGameIds.length} games`} tone="accent" />
      </div>

      <Card>
        <CardHeader
          title={`Courts (${courts.length})`}
          action={canManageCourts ? <Button size="sm" icon={PlusCircle} onClick={() => setAddCourtOpen(true)}>Add Court</Button> : null}
        />
        <CardBody>
          <DataTable columns={courtColumns} rows={courts} emptyTitle="No courts yet" emptyMessage="Add the club's first court to start accepting bookings." />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent Bookings" />
          <CardBody className="space-y-2">
            {recentBookings.length === 0 && <p className="text-sm text-ink-400">No bookings yet.</p>}
            {recentBookings.map((b) => {
              const u = store.getUser(b.userId);
              const court = store.getCourt(b.courtId);
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{u?.name}</p>
                    <p className="text-xs text-ink-400">{court?.name} · {formatDate(b.date)} · {formatTime(b.startTime)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink-800">{money(b.amount)}</p>
                    <Badge status={b.status} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent Games" />
          <CardBody className="space-y-2">
            {recentGames.length === 0 && <p className="text-sm text-ink-400">No games hosted yet.</p>}
            {recentGames.map((g) => (
              <button key={g.id} onClick={() => navigate(`/games/${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 text-left text-sm hover:border-brand-200 hover:bg-brand-50/40">
                <div>
                  <p className="font-medium text-ink-800">{g.name}</p>
                  <p className="text-xs text-ink-400">{formatDate(g.date)} · {formatTime(g.startTime)} · {g.currentPlayers}/{g.maxPlayers} players</p>
                </div>
                <Badge status={g.status} />
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      {canManageCourts && <AddCourtModal open={addCourtOpen} onClose={() => setAddCourtOpen(false)} clubId={club.id} adminId={user?.id} />}
      {canManageCourts && (
        <EditCourtPricingModal
          key={pricingTarget?.id || 'none'}
          open={!!pricingTarget}
          onClose={() => setPricingTarget(null)}
          court={pricingTarget}
          adminId={user?.id}
        />
      )}
    </div>
  );
}

function Info({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 text-ink-400 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink-800">{label}</p>
        {sub && <p className="text-xs text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}

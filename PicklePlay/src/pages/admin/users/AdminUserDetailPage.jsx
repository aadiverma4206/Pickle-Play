import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, ShieldCheck, ShieldBan, Pencil, Star, Users as UsersIcon,
  Gamepad2, Trophy, XCircle, TrendingUp,
} from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS, ROLES, ROLE_LABELS } from '../../../lib/permissions';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Tabs from '../../../components/ui/Tabs';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import { Select, Input, Textarea, FormRow } from '../../../components/ui/Field';
import { EmptyState, LoadingState } from '../../../components/ui/States';
import { formatDate, formatDateTime, formatTime, timeAgo, money, pct } from '../../../lib/format';
import SuspendUserModal from './SuspendUserModal';

function actionLabel(action) {
  return action.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <div className="mt-1 text-sm text-ink-800">{value}</div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const actingUser = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [tab, setTab] = useState('profile');
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [newRating, setNewRating] = useState('');
  const [ratingReason, setRatingReason] = useState('');
  const [ratingError, setRatingError] = useState('');

  const targetUser = store.getUser(userId);

  if (!targetUser) return <LoadingState label="Loading user…" />;

  const canManageUsers = can(actingUser?.role, PERMISSIONS.USERS_MANAGE);
  const canManageRoles = can(actingUser?.role, PERMISSIONS.ROLES_MANAGE);
  const canOverrideRating = can(actingUser?.role, PERMISSIONS.RATING_OVERRIDE) && !!store.settings?.rating?.allowManualAdjustment;

  const rating = store.getRating(userId);
  const performance = store.getPerformance(userId);

  const gameMap = new Map();
  [...store.gamesJoinedBy(userId), ...store.gamesOrganizedBy(userId)].forEach((g) => gameMap.set(g.id, g));
  const allGames = [...gameMap.values()].sort((a, b) => new Date(`${b.date}T${b.startTime || '00:00'}`) - new Date(`${a.date}T${a.startTime || '00:00'}`));
  const upcomingGames = allGames.filter((g) => !['CANCELLED', 'COMPLETED'].includes(g.status)).sort((a, b) => new Date(`${a.date}T${a.startTime || '00:00'}`) - new Date(`${b.date}T${b.startTime || '00:00'}`));
  const completedGames = allGames.filter((g) => g.status === 'COMPLETED');
  const cancelledGames = allGames.filter((g) => g.status === 'CANCELLED');

  const registrations = store.registrationsForUser(userId);
  const communities = store.communitiesForUser(userId);
  const postCount = store.posts.filter((p) => p.userId === userId).length;
  const payments = store.paymentsForUser(userId);
  const tickets = store.ticketsForUser(userId);
  const bookings = store.bookingsForUser(userId);
  const auditLogs = store.auditLogsFor(userId);

  const mostRecentGameDate = allGames[0]?.date || null;
  const mostRecentBookingDate = bookings[0]?.date || null;

  const tabs = [
    { value: 'profile', label: 'Profile' },
    { value: 'performance', label: 'Performance' },
    { value: 'games', label: 'Games', count: allGames.length },
    { value: 'tournaments', label: 'Tournaments', count: registrations.length },
    { value: 'community', label: 'Community', count: communities.length },
    { value: 'finance', label: 'Finance', count: payments.length },
    { value: 'support', label: 'Support', count: tickets.length },
    { value: 'activity', label: 'Activity' },
    { value: 'audit', label: 'Audit', count: auditLogs.length },
  ];

  const openRoleModal = () => { setNewRole(targetUser.role); setRoleModalOpen(true); };

  const confirmRoleChange = () => {
    if (!newRole || newRole === targetUser.role) { setRoleModalOpen(false); return; }
    const targetRole = newRole;
    setRoleModalOpen(false);
    store.askConfirm({
      title: 'Change user role?',
      message: `${targetUser.name} will become ${ROLE_LABELS[targetRole]}. This changes their platform access immediately.`,
      confirmLabel: 'Change Role',
      onConfirm: () => {
        const r = store.changeUserRole(targetUser.id, targetRole, actingUser.id);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${targetUser.name} is now ${ROLE_LABELS[targetRole]}.`, 'success');
      },
    });
  };

  const handleActivate = () => {
    store.askConfirm({
      title: 'Activate user?',
      message: `${targetUser.name} will regain full access to the platform immediately.`,
      confirmLabel: 'Activate',
      onConfirm: () => {
        const r = store.setUserStatus(targetUser.id, 'ACTIVE', actingUser.id, 'Reactivated by admin.');
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`${targetUser.name} has been activated.`, 'success');
      },
    });
  };

  const openRatingModal = () => {
    setNewRating(String(rating?.skillRating ?? ''));
    setRatingReason('');
    setRatingError('');
    setRatingModalOpen(true);
  };

  const confirmRatingChange = () => {
    const val = Number(newRating);
    if (newRating === '' || Number.isNaN(val) || val < 0) { setRatingError('Enter a valid non-negative rating.'); return; }
    if (!ratingReason.trim()) { setRatingError('Please provide a reason for this adjustment.'); return; }
    const r = store.setRating(targetUser.id, Math.round(val), actingUser.id, ratingReason.trim());
    if (!r.ok) { store.toast(r.error, 'error'); return; }
    store.toast(`Rating updated to ${Math.round(val)}.`, 'success');
    setRatingModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => navigate('/admin/users')} className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="size-4" /> Back to Users
      </button>

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={targetUser.name} src={targetUser.profileImage} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-ink-900">{targetUser.name}</h1>
                <Badge status={targetUser.status} />
                <Badge tone={targetUser.role === 'PLAYER' ? 'neutral' : 'brand'}>{ROLE_LABELS[targetUser.role] || targetUser.role}</Badge>
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                <span className="flex items-center gap-1"><Mail className="size-3.5" />{targetUser.email}</span>
                <span className="flex items-center gap-1"><Phone className="size-3.5" />{targetUser.mobile}</span>
                {targetUser.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{targetUser.city}</span>}
              </p>
              <p className="mt-1 text-xs text-ink-400">Member since {formatDate(targetUser.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageRoles && <Button variant="secondary" size="sm" icon={Pencil} onClick={openRoleModal}>Edit Role</Button>}
            {canManageUsers && targetUser.id !== actingUser?.id && (
              targetUser.status === 'ACTIVE' ? (
                <Button variant="outlineDanger" size="sm" icon={ShieldBan} onClick={() => setSuspendOpen(true)}>Suspend</Button>
              ) : (
                <Button variant="secondary" size="sm" icon={ShieldCheck} onClick={handleActivate}>Activate</Button>
              )
            )}
          </div>
        </CardBody>
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Profile Details" />
            <CardBody className="grid grid-cols-2 gap-4">
              <Field label="Gender" value={targetUser.gender || '—'} />
              <Field label="Date of Birth" value={targetUser.dob ? formatDate(targetUser.dob) : '—'} />
              <Field label="City" value={targetUser.city || '—'} />
              <Field label="Area" value={targetUser.area || '—'} />
              <Field label="Skill Level" value={targetUser.skillLevel || '—'} />
              <Field label="Playing Hand" value={targetUser.playingHand || '—'} />
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Bio</p>
                <p className="mt-1 text-sm text-ink-700">{targetUser.bio || 'No bio provided.'}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Rating & Reliability"
              action={canOverrideRating && <Button size="sm" variant="secondary" icon={Pencil} onClick={openRatingModal}>Adjust Rating</Button>}
            />
            <CardBody className="space-y-4">
              {rating ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={Star} label="Skill Rating" value={rating.skillRating} tone="brand" />
                    <StatCard icon={UsersIcon} label="Community" value={`${rating.communityRating?.toFixed(1) ?? '—'} / 5`} hint={`${rating.communityRatingCount} ratings`} tone="court" />
                    <StatCard icon={ShieldCheck} label="Reliability" value={pct(rating.reliabilityScore)} tone="ink" />
                  </div>
                  <p className="text-xs text-ink-400">Last updated {timeAgo(rating.lastUpdated)}</p>
                </>
              ) : <EmptyState title="No rating record" message="This user has no rating data yet." />}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'performance' && (
        performance ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Gamepad2} label="Matches Played" value={performance.matchesPlayed} tone="brand" />
              <StatCard icon={Trophy} label="Wins" value={performance.wins} tone="court" />
              <StatCard icon={XCircle} label="Losses" value={performance.losses} tone="danger" />
              <StatCard icon={TrendingUp} label="Win Rate" value={pct(performance.winRate)} tone="accent" />
            </div>
            <Card>
              <CardHeader title="Streaks, Points & Tournaments" />
              <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Current Streak" value={performance.currentStreak > 0 ? `W${performance.currentStreak}` : performance.currentStreak < 0 ? `L${Math.abs(performance.currentStreak)}` : '—'} />
                <Field label="Longest Streak" value={performance.longestStreak} />
                <Field label="Points Scored" value={performance.pointsScored} />
                <Field label="Points Conceded" value={performance.pointsConceded} />
                <Field label="Tournament Matches" value={performance.tournamentMatches} />
                <Field label="Tournament Wins" value={performance.tournamentWins} />
                <Field label="Finals Reached" value={performance.finals} />
                <Field label="Titles Won" value={performance.titles} />
              </CardBody>
            </Card>
          </div>
        ) : <EmptyState title="No performance data" message="This user hasn't played any matches yet." />
      )}

      {tab === 'games' && (
        <div className="space-y-6">
          <GameListCard title="Upcoming" list={upcomingGames} emptyMsg="No upcoming games." store={store} targetUser={targetUser} navigate={navigate} />
          <GameListCard title="Completed" list={completedGames} emptyMsg="No completed games yet." store={store} targetUser={targetUser} navigate={navigate} />
          <GameListCard title="Cancelled" list={cancelledGames} emptyMsg="No cancelled games." store={store} targetUser={targetUser} navigate={navigate} />
        </div>
      )}

      {tab === 'tournaments' && (
        <DataTable
          columns={[
            { key: 'tournament', header: 'Tournament', render: (row) => store.getTournament(row.tournamentId)?.name || '—' },
            { key: 'role', header: 'Role', render: (row) => (row.userId === targetUser.id ? 'Registrant' : 'Partner') },
            { key: 'team', header: 'Team', render: (row) => row.teamName || '—' },
            { key: 'payment', header: 'Payment', render: (row) => <Badge status={row.paymentStatus} /> },
            { key: 'status', header: 'Registration', render: (row) => <Badge status={row.status} /> },
            { key: 'tstatus', header: 'Tournament Status', render: (row) => <Badge status={store.getTournament(row.tournamentId)?.status} /> },
            { key: 'registeredAt', header: 'Registered', render: (row) => formatDate(row.registeredAt) },
          ]}
          rows={registrations}
          onRowClick={(row) => navigate(`/tournaments/${row.tournamentId}`)}
          emptyTitle="No tournament registrations"
          emptyMessage="This user hasn't registered for any tournaments."
        />
      )}

      {tab === 'community' && (
        <Card>
          <CardHeader title="Communities" subtitle={`Member of ${communities.length} ${communities.length === 1 ? 'community' : 'communities'} · ${postCount} posts authored`} />
          <CardBody>
            {communities.length === 0 ? (
              <EmptyState title="Not part of any communities" message="This user hasn't joined a community yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {communities.map((c) => {
                  const membership = store.membershipOf(c.id, targetUser.id);
                  return (
                    <button key={c.id} onClick={() => navigate(`/community/${c.id}`)} className="flex items-center justify-between rounded-lg border border-ink-100 px-4 py-3 text-left hover:border-brand-200 hover:bg-brand-50/40">
                      <div>
                        <p className="text-sm font-medium text-ink-800">{c.name}</p>
                        <p className="text-xs text-ink-400">{c.location} · {c.skillLevel}</p>
                      </div>
                      <Badge tone="neutral">{membership?.role}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'finance' && (
        <DataTable
          columns={[
            { key: 'id', header: 'Payment ID' },
            { key: 'reference', header: 'For', render: (row) => `${row.referenceType} · ${row.referenceId}` },
            { key: 'amount', header: 'Amount', render: (row) => money(row.amount) },
            { key: 'method', header: 'Method' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
          ]}
          rows={payments}
          emptyTitle="No payments"
          emptyMessage="This user has no payment history."
        />
      )}

      {tab === 'support' && (
        <DataTable
          columns={[
            { key: 'subject', header: 'Subject' },
            { key: 'category', header: 'Category' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            { key: 'responses', header: 'Responses', render: (row) => row.responses.length },
            { key: 'createdAt', header: 'Opened', render: (row) => formatDate(row.createdAt) },
          ]}
          rows={tickets}
          emptyTitle="No support tickets"
          emptyMessage="This user has not raised any support tickets."
        />
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader title="Activity Summary" />
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Member Since" value={formatDate(targetUser.createdAt)} />
            <Field label="Account Status" value={<Badge status={targetUser.status} />} />
            <Field label="Most Recent Game" value={mostRecentGameDate ? formatDate(mostRecentGameDate) : 'No games yet'} />
            <Field label="Most Recent Booking" value={mostRecentBookingDate ? formatDate(mostRecentBookingDate) : 'No bookings yet'} />
            <Field label="Total Games Played" value={allGames.length} />
            <Field label="Total Bookings Made" value={bookings.length} />
          </CardBody>
        </Card>
      )}

      {tab === 'audit' && (
        <DataTable
          columns={[
            { key: 'action', header: 'Action', render: (row) => actionLabel(row.action) },
            { key: 'admin', header: 'By', render: (row) => store.getUser(row.adminId)?.name || 'System' },
            { key: 'change', header: 'Change', render: (row) => (row.oldValue != null || row.newValue != null) ? `${row.oldValue ?? '—'} → ${row.newValue ?? '—'}` : '—' },
            { key: 'note', header: 'Note', render: (row) => row.note || '—' },
            { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
          ]}
          rows={auditLogs}
          emptyTitle="No audit entries"
          emptyMessage="No administrative actions have been taken on this user yet."
        />
      )}

      <SuspendUserModal open={suspendOpen} user={targetUser} actingUserId={actingUser?.id} onClose={() => setSuspendOpen(false)} />

      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change role for ${targetUser.name}`}
        subtitle="This changes the user's access across the platform immediately."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmRoleChange}>Save Role</Button>
          </>
        )}
      >
        <FormRow label="Role" required>
          <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </FormRow>
      </Modal>

      <Modal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title={`Adjust rating for ${targetUser.name}`}
        subtitle="Manual rating overrides are audit-logged with the reason you provide."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setRatingModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmRatingChange}>Save Rating</Button>
          </>
        )}
      >
        <div className="space-y-4">
          <FormRow label="New Skill Rating" required>
            <Input type="number" min={0} value={newRating} onChange={(e) => { setNewRating(e.target.value); if (ratingError) setRatingError(''); }} />
          </FormRow>
          <FormRow label="Reason" required>
            <Textarea value={ratingReason} onChange={(e) => { setRatingReason(e.target.value); if (ratingError) setRatingError(''); }} placeholder="e.g. Correcting a data entry error from a manual tournament seed." />
          </FormRow>
          {ratingError && <p className="text-sm text-red-600">{ratingError}</p>}
        </div>
      </Modal>
    </div>
  );
}

function GameListCard({ title, list, emptyMsg, store, targetUser, navigate }) {
  return (
    <Card>
      <CardHeader title={`${title} (${list.length})`} />
      <CardBody className="space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-ink-400">{emptyMsg}</p>
        ) : (
          list.map((g) => {
            const club = store.getClub(g.clubId);
            const isOrganizer = g.organizerId === targetUser.id;
            return (
              <button
                key={g.id}
                onClick={() => navigate(`/games/${g.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-2.5 text-left hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div>
                  <p className="text-sm font-medium text-ink-800">{g.name}{isOrganizer && <span className="ml-1.5 text-xs text-brand-600">(Organizer)</span>}</p>
                  <p className="text-xs text-ink-400">{club?.name} · {formatDate(g.date)} · {formatTime(g.startTime)}</p>
                </div>
                <Badge status={g.status} />
              </button>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}

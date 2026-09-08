import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, UserCheck, ShieldBan, Gamepad2, CheckCircle2, XCircle, CalendarCheck,
  Wallet, Receipt, TrendingUp, RotateCcw, Trophy, CalendarClock, Users as UsersIcon,
  MessagesSquare, Newspaper, BarChart3,
} from 'lucide-react';
import { useStore } from '../../../store';
import { ROLE_LABELS } from '../../../lib/permissions';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Tabs from '../../../components/ui/Tabs';
import { Input, FormRow } from '../../../components/ui/Field';
import { EmptyState } from '../../../components/ui/States';
import { money, formatDate, formatDateTime, formatTime } from '../../../lib/format';

const TABS = [
  { value: 'users', label: 'Users' },
  { value: 'games', label: 'Games' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'tournaments', label: 'Tournaments' },
  { value: 'communities', label: 'Communities' },
];

// ---- shared helpers ---------------------------------------------------------

/** Inclusive yyyy-mm-dd range check against a value that may be a plain date
 *  string or a full ISO datetime — only the date portion is compared. */
function inRange(dateValue, from, to) {
  if (!dateValue) return false;
  const day = dateValue.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/** Buckets `items` by the date portion of `dateField`, either counting
 *  occurrences (no `valueField`) or summing a numeric `valueField`. Returns
 *  chronologically sorted {date,label,value} points — real data only, no
 *  gap-filling, since gaps are informative in these reports. */
function buildTrend(items, dateField, valueField) {
  const map = new Map();
  items.forEach((it) => {
    const raw = it[dateField];
    if (!raw) return;
    const day = raw.slice(0, 10);
    const inc = valueField ? Number(it[valueField]) || 0 : 1;
    map.set(day, (map.get(day) || 0) + inc);
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, label: formatDate(date, 'dd MMM'), value }));
}

function TrendChart({ title, subtitle, data, color, valueLabel, formatValue }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        {data.length === 0 ? (
          <EmptyState icon={BarChart3} title="No data in this range" message="Try widening the date range above." />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eceef1" />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d7dbe1' }} tick={{ fill: '#666f80', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#666f80', fontSize: 12 }} width={48} />
                <Tooltip
                  cursor={{ fill: '#f7f8f9' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #d7dbe1', fontSize: 12, boxShadow: '0 4px 12px rgba(23,26,35,0.08)' }}
                  labelStyle={{ color: '#171a23', fontWeight: 600 }}
                  formatter={(value) => [formatValue ? formatValue(value) : value, valueLabel]}
                />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ---- Users -------------------------------------------------------------------

function UsersReport({ store, dateFrom, dateTo }) {
  const filtered = useMemo(
    () => store.users.filter((u) => inRange(u.createdAt, dateFrom, dateTo)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [store.users, dateFrom, dateTo]
  );
  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((u) => u.status === 'ACTIVE').length,
    players: filtered.filter((u) => u.role === 'PLAYER').length,
    suspended: filtered.filter((u) => u.status !== 'ACTIVE').length,
  }), [filtered]);
  const trend = useMemo(() => buildTrend(filtered, 'createdAt'), [filtered]);

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.profileImage} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{row.name}</p>
            <p className="text-xs text-ink-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (row) => <Badge tone={row.role === 'PLAYER' ? 'neutral' : 'brand'}>{ROLE_LABELS[row.role] || row.role}</Badge> },
    { key: 'city', header: 'City', render: (row) => row.city || '—' },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'joined', header: 'Joined', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Signups" value={stats.total} tone="brand" />
        <StatCard icon={UserCheck} label="Active" value={stats.active} tone="court" />
        <StatCard icon={UsersIcon} label="Players" value={stats.players} tone="ink" />
        <StatCard icon={ShieldBan} label="Suspended / Blocked" value={stats.suspended} tone={stats.suspended > 0 ? 'danger' : 'ink'} />
      </div>
      <TrendChart title="Signups over time" subtitle="New accounts created per day in the selected range." data={trend} color="#2e8a28" valueLabel="Signups" />
      <DataTable columns={columns} rows={filtered} emptyTitle="No users in this range" emptyMessage="Try widening the date range above." />
    </div>
  );
}

// ---- Games ---------------------------------------------------------------------

function GamesReport({ store, dateFrom, dateTo }) {
  const filtered = useMemo(
    () => store.games.filter((g) => inRange(g.date, dateFrom, dateTo)).sort((a, b) => new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`)),
    [store.games, dateFrom, dateTo]
  );
  const stats = useMemo(() => ({
    total: filtered.length,
    completed: filtered.filter((g) => g.status === 'COMPLETED').length,
    cancelled: filtered.filter((g) => g.status === 'CANCELLED').length,
    players: filtered.reduce((sum, g) => sum + (g.currentPlayers || 0), 0),
  }), [filtered]);
  const trend = useMemo(() => buildTrend(filtered, 'date'), [filtered]);

  const columns = [
    {
      key: 'name',
      header: 'Game',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-400">{row.gameType} · {row.skillLevel}</p>
        </div>
      ),
    },
    { key: 'club', header: 'Club', render: (row) => store.getClub(row.clubId)?.name || '—' },
    { key: 'date', header: 'Date', render: (row) => `${formatDate(row.date)} · ${formatTime(row.startTime)}` },
    { key: 'players', header: 'Players', render: (row) => `${row.currentPlayers}/${row.maxPlayers}` },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Gamepad2} label="Total Games" value={stats.total} tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="court" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} tone={stats.cancelled > 0 ? 'danger' : 'ink'} />
        <StatCard icon={UsersIcon} label="Players Joined" value={stats.players} tone="ink" />
      </div>
      <TrendChart title="Games scheduled over time" subtitle="Count of games per day in the selected range." data={trend} color="#1c6eef" valueLabel="Games" />
      <DataTable columns={columns} rows={filtered} emptyTitle="No games in this range" emptyMessage="Try widening the date range above." />
    </div>
  );
}

// ---- Bookings ------------------------------------------------------------------

function BookingsReport({ store, dateFrom, dateTo }) {
  const filtered = useMemo(
    () => store.bookings.filter((b) => inRange(b.date, dateFrom, dateTo)).sort((a, b) => new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`)),
    [store.bookings, dateFrom, dateTo]
  );
  const stats = useMemo(() => {
    const confirmed = filtered.filter((b) => ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(b.status));
    const cancelled = filtered.filter((b) => ['CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(b.status));
    const revenue = filtered.filter((b) => b.paymentStatus === 'SUCCESS').reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    return { total: filtered.length, confirmed: confirmed.length, cancelled: cancelled.length, revenue };
  }, [filtered]);
  const trend = useMemo(() => buildTrend(filtered, 'date'), [filtered]);

  const columns = [
    { key: 'user', header: 'User', render: (row) => store.getUser(row.userId)?.name || '—' },
    {
      key: 'court',
      header: 'Club / Court',
      render: (row) => `${store.getClub(row.clubId)?.name || '—'} · ${store.getCourt(row.courtId)?.name || '—'}`,
    },
    { key: 'date', header: 'Date', render: (row) => `${formatDate(row.date)} · ${formatTime(row.startTime)}–${formatTime(row.endTime)}` },
    { key: 'amount', header: 'Amount', render: (row) => money(row.amount) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Total Bookings" value={stats.total} tone="brand" />
        <StatCard icon={CheckCircle2} label="Confirmed / Completed" value={stats.confirmed} tone="court" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} tone={stats.cancelled > 0 ? 'danger' : 'ink'} />
        <StatCard icon={Wallet} label="Revenue" value={money(stats.revenue)} tone="accent" />
      </div>
      <TrendChart title="Bookings over time" subtitle="Count of court bookings per day in the selected range." data={trend} color="#e79e00" valueLabel="Bookings" />
      <DataTable columns={columns} rows={filtered} emptyTitle="No bookings in this range" emptyMessage="Try widening the date range above." />
    </div>
  );
}

// ---- Revenue -------------------------------------------------------------------

function RevenueReport({ store, dateFrom, dateTo }) {
  const filtered = useMemo(
    () => store.payments.filter((p) => inRange(p.createdAt, dateFrom, dateTo)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [store.payments, dateFrom, dateTo]
  );
  const stats = useMemo(() => {
    const success = filtered.filter((p) => p.status === 'SUCCESS');
    const revenue = success.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const refunded = filtered
      .filter((p) => ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(p.status))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { revenue, count: success.length, avg: success.length ? Math.round(revenue / success.length) : 0, refunded };
  }, [filtered]);
  const trend = useMemo(() => buildTrend(filtered.filter((p) => p.status === 'SUCCESS'), 'createdAt', 'amount'), [filtered]);

  const columns = [
    { key: 'user', header: 'User', render: (row) => store.getUser(row.userId)?.name || '—' },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge tone="neutral">{row.referenceType}</Badge>
          <span className="text-xs text-ink-400">{row.referenceId}</span>
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', render: (row) => money(row.amount) },
    { key: 'method', header: 'Method', render: (row) => row.method },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Total Revenue" value={money(stats.revenue)} tone="brand" />
        <StatCard icon={Receipt} label="Transactions" value={stats.count} tone="court" />
        <StatCard icon={TrendingUp} label="Avg. Transaction" value={money(stats.avg)} tone="ink" />
        <StatCard icon={RotateCcw} label="Refunded" value={money(stats.refunded)} tone={stats.refunded > 0 ? 'danger' : 'ink'} />
      </div>
      <TrendChart title="Revenue over time" subtitle="Successful payment value per day in the selected range." data={trend} color="#2e8a28" valueLabel="Revenue" formatValue={money} />
      <DataTable columns={columns} rows={filtered} emptyTitle="No payments in this range" emptyMessage="Try widening the date range above." />
    </div>
  );
}

// ---- Tournaments ---------------------------------------------------------------

function TournamentsReport({ store, dateFrom, dateTo }) {
  const filtered = useMemo(
    () => store.tournaments.filter((t) => inRange(t.startDate, dateFrom, dateTo)).sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    [store.tournaments, dateFrom, dateTo]
  );
  const registrationsInRange = useMemo(() => filtered.flatMap((t) => store.registrationsFor(t.id)), [filtered, store]);
  const stats = useMemo(() => ({
    total: filtered.length,
    live: filtered.filter((t) => ['LIVE', 'UPCOMING', 'REGISTRATION_OPEN'].includes(t.status)).length,
    completed: filtered.filter((t) => t.status === 'COMPLETED').length,
    registrations: registrationsInRange.filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status)).length,
  }), [filtered, registrationsInRange]);
  const trend = useMemo(() => buildTrend(registrationsInRange, 'registeredAt'), [registrationsInRange]);

  const columns = [
    {
      key: 'name',
      header: 'Tournament',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-400">{row.category} · {row.skillLevel}</p>
        </div>
      ),
    },
    { key: 'venue', header: 'Venue', render: (row) => store.getClub(row.venueClubId)?.name || '—' },
    { key: 'dates', header: 'Dates', render: (row) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}` },
    {
      key: 'registrations',
      header: 'Registrations',
      render: (row) => {
        const active = store.registrationsFor(row.id).filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status)).length;
        return `${active}/${row.maxParticipants}`;
      },
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Trophy} label="Tournaments" value={stats.total} tone="accent" />
        <StatCard icon={CalendarClock} label="Live / Upcoming" value={stats.live} tone="court" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="brand" />
        <StatCard icon={UsersIcon} label="Registrations" value={stats.registrations} tone="ink" />
      </div>
      <TrendChart title="Registrations over time" subtitle="Sign-ups per day for tournaments starting in the selected range." data={trend} color="#e79e00" valueLabel="Registrations" />
      <DataTable columns={columns} rows={filtered} emptyTitle="No tournaments in this range" emptyMessage="Try widening the date range above." />
    </div>
  );
}

// ---- Communities ---------------------------------------------------------------

function CommunitiesReport({ store, dateFrom, dateTo }) {
  const filtered = useMemo(
    () => store.communities.filter((c) => inRange(c.createdAt, dateFrom, dateTo)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [store.communities, dateFrom, dateTo]
  );
  const memberRows = useMemo(() => filtered.flatMap((c) => store.membersOf(c.id)), [filtered, store]);
  const postRows = useMemo(() => filtered.flatMap((c) => store.postsFor(c.id)), [filtered, store]);
  const stats = useMemo(() => ({
    total: filtered.length,
    members: memberRows.length,
    posts: postRows.length,
    avgMembers: filtered.length ? Math.round(memberRows.length / filtered.length) : 0,
  }), [filtered, memberRows, postRows]);
  const trend = useMemo(() => buildTrend(memberRows, 'joinedAt'), [memberRows]);

  const columns = [
    {
      key: 'name',
      header: 'Community',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-400">{row.location}</p>
        </div>
      ),
    },
    { key: 'skillLevel', header: 'Skill Level' },
    { key: 'members', header: 'Active Members', render: (row) => store.membersOf(row.id).length },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'created', header: 'Created', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={MessagesSquare} label="Communities" value={stats.total} tone="court" />
        <StatCard icon={UsersIcon} label="Active Members" value={stats.members} tone="brand" />
        <StatCard icon={Newspaper} label="Posts" value={stats.posts} tone="ink" />
        <StatCard icon={TrendingUp} label="Avg. Members / Community" value={stats.avgMembers} tone="accent" />
      </div>
      <TrendChart title="New members over time" subtitle="Members joined per day for communities created in the selected range." data={trend} color="#1c6eef" valueLabel="New Members" />
      <DataTable columns={columns} rows={filtered} emptyTitle="No communities in this range" emptyMessage="Try widening the date range above." />
    </div>
  );
}

// ---- Page ------------------------------------------------------------------------

export default function AdminReportsPage() {
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const [tab, setTab] = useState('users');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const clearRange = () => { setDateFrom(''); setDateTo(''); };

  return (
    <div>
      <SectionHeader title="Reports" subtitle="Platform-wide analytics across users, games, bookings, revenue, tournaments and communities." />

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-5" />

      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-end gap-3">
          <FormRow label="From">
            <Input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
          </FormRow>
          <FormRow label="To">
            <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
          </FormRow>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearRange}>Clear range</Button>
          )}
          <p className="ml-auto text-xs text-ink-400">{dateFrom || dateTo ? 'Filtering by the date range above.' : 'Showing all-time data — set a range to narrow it down.'}</p>
        </CardBody>
      </Card>

      {tab === 'users' && <UsersReport store={store} dateFrom={dateFrom} dateTo={dateTo} />}
      {tab === 'games' && <GamesReport store={store} dateFrom={dateFrom} dateTo={dateTo} />}
      {tab === 'bookings' && <BookingsReport store={store} dateFrom={dateFrom} dateTo={dateTo} />}
      {tab === 'revenue' && <RevenueReport store={store} dateFrom={dateFrom} dateTo={dateTo} />}
      {tab === 'tournaments' && <TournamentsReport store={store} dateFrom={dateFrom} dateTo={dateTo} />}
      {tab === 'communities' && <CommunitiesReport store={store} dateFrom={dateFrom} dateTo={dateTo} />}
    </div>
  );
}

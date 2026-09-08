import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, UserCheck, Building2, LayoutGrid, Gamepad2, CalendarCheck, Wallet,
  Trophy, MessagesSquare, RotateCcw, LifeBuoy, History,
} from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../lib/permissions';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import SectionHeader from '../../components/ui/SectionHeader';
import Avatar from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/States';
import { money, formatDate, timeAgo } from '../../lib/format';

function actionLabel(action) {
  return action.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export default function AdminDashboardPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const { users, clubs, courts, games, bookings, payments, tournaments, communities, tickets } = store;
    const revenueToday = payments
      .filter((p) => p.status === 'SUCCESS' && (p.createdAt || '').slice(0, 10) === today)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
      totalClubs: clubs.length,
      totalCourts: courts.length,
      gamesToday: games.filter((g) => g.date === today).length,
      bookingsToday: bookings.filter((b) => b.date === today).length,
      revenueToday,
      activeTournaments: tournaments.filter((t) => ['LIVE', 'REGISTRATION_OPEN'].includes(t.status)).length,
      totalCommunities: communities.length,
      pendingRefunds: bookings.filter((b) => b.status === 'REFUND_PENDING').length,
      openComplaints: tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length,
    };
  }, [store, today]);

  // Real 7-day trailing window (today inclusive) computed off actual seeded game dates.
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        label: formatDate(dateStr, 'dd MMM'),
        games: store.games.filter((g) => g.date === dateStr).length,
      });
    }
    return days;
  }, [store.games]);

  const recentActivity = store.allAuditLogs().slice(0, 8);

  return (
    <div className="space-y-6">
      <SectionHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'Admin'}`} subtitle="Platform-wide metrics and activity at a glance." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} tone="brand" />
        <StatCard icon={UserCheck} label="Active Users" value={stats.activeUsers} tone="court" />
        <StatCard icon={Building2} label="Clubs" value={stats.totalClubs} tone="ink" />
        <StatCard icon={LayoutGrid} label="Courts" value={stats.totalCourts} tone="ink" />
        <StatCard icon={Gamepad2} label="Games Today" value={stats.gamesToday} tone="brand" />
        <StatCard icon={CalendarCheck} label="Bookings Today" value={stats.bookingsToday} tone="court" />
        <StatCard icon={Wallet} label="Revenue Today" value={money(stats.revenueToday)} tone="accent" />
        <StatCard icon={Trophy} label="Active Tournaments" value={stats.activeTournaments} tone="accent" />
        <StatCard icon={MessagesSquare} label="Communities" value={stats.totalCommunities} tone="ink" />
        <StatCard icon={RotateCcw} label="Pending Refunds" value={stats.pendingRefunds} tone={stats.pendingRefunds > 0 ? 'danger' : 'ink'} />
        <StatCard icon={LifeBuoy} label="Open Complaints" value={stats.openComplaints} tone={stats.openComplaints > 0 ? 'danger' : 'ink'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Games — last 7 days" subtitle="Count of games scheduled per day." />
          <CardBody>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eceef1" />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d7dbe1' }} tick={{ fill: '#666f80', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#666f80', fontSize: 12 }} width={32} />
                  <Tooltip
                    cursor={{ fill: '#f7f8f9' }}
                    contentStyle={{ borderRadius: 10, border: '1px solid #d7dbe1', fontSize: 12, boxShadow: '0 4px 12px rgba(23,26,35,0.08)' }}
                    labelStyle={{ color: '#171a23', fontWeight: 600 }}
                    formatter={(value) => [value, 'Games']}
                  />
                  <Bar dataKey="games" fill="#2e8a28" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Activity"
            action={can(user?.role, PERMISSIONS.AUDIT_VIEW) && (
              <Link to="/admin/audit" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
            )}
          />
          <CardBody className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState icon={History} title="No activity yet" message="Administrative actions will show up here." />
            ) : (
              recentActivity.map((log) => {
                const admin = store.getUser(log.adminId);
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <Avatar name={admin?.name} src={admin?.profileImage} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-800">
                        <span className="font-medium">{admin?.name || 'System'}</span> {actionLabel(log.action).toLowerCase()}
                      </p>
                      <p className="text-xs text-ink-400">{log.module} · {timeAgo(log.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Ban, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { BOOKING_STATUS } from '../../../lib/stateMachines';
import { cancelBooking, approveRefund } from '../../../services/bookingService';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardBody } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import SearchInput from '../../../components/ui/SearchInput';
import { Select, Input, Label } from '../../../components/ui/Field';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate, formatTime, money } from '../../../lib/format';

export default function AdminBookingsPage() {
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Cancelling a booking is an operational action — gated to whichever role
  // actually holds BOOKINGS_MANAGE (Ops Admin / Club Manager).
  const canCancelBookings = can(user?.role, PERMISSIONS.BOOKINGS_MANAGE);
  // Approving a refund is checked against BOTH Finance's and Ops/Club's manage
  // permission because either org role may reasonably own this step depending
  // on deployment — a real deployment would pick exactly one to avoid overlap.
  const canApproveRefunds = can(user?.role, PERMISSIONS.FINANCE_MANAGE) || can(user?.role, PERMISSIONS.BOOKINGS_MANAGE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...store.bookings]
      .filter((b) => {
        if (!q) return true;
        const u = store.getUser(b.userId);
        return (u?.name || '').toLowerCase().includes(q) || (u?.email || '').toLowerCase().includes(q);
      })
      .filter((b) => (statusFilter ? b.status === statusFilter : true))
      .filter((b) => (dateFrom ? b.date >= dateFrom : true))
      .filter((b) => (dateTo ? b.date <= dateTo : true))
      .sort((a, b) => new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`));
  }, [store, search, statusFilter, dateFrom, dateTo]);

  const handleCancel = (booking) => {
    const u = store.getUser(booking.userId);
    store.askConfirm({
      title: 'Cancel this booking?',
      message: `This will cancel ${u?.name || 'this user'}'s booking and calculate a refund per the club's cancellation policy.`,
      confirmLabel: 'Cancel Booking',
      tone: 'danger',
      onConfirm: () => {
        const r = cancelBooking(booking.id, user.id, true);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(r.refund?.amount > 0 ? `Booking cancelled — ${money(r.refund.amount)} refund pending.` : 'Booking cancelled — no refund applies.', 'success');
      },
    });
  };

  const handleApproveRefund = (booking) => {
    const u = store.getUser(booking.userId);
    store.askConfirm({
      title: 'Approve this refund?',
      message: `${money(booking.refund?.amount || 0)} will be refunded to ${u?.name || 'this user'} for this booking.`,
      confirmLabel: 'Approve Refund',
      onConfirm: () => {
        const r = approveRefund(booking.id, user.id);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast('Refund approved and processed.', 'success');
      },
    });
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (b) => {
        const u = store.getUser(b.userId);
        return (
          <div>
            <p className="font-medium text-ink-900">{u?.name || '—'}</p>
            <p className="text-xs text-ink-400">{u?.email}</p>
          </div>
        );
      },
    },
    {
      key: 'venue',
      header: 'Club / Court',
      render: (b) => {
        const club = store.getClub(b.clubId);
        const court = store.getCourt(b.courtId);
        return <span>{club?.name}<br /><span className="text-xs text-ink-400">{court?.name}</span></span>;
      },
    },
    {
      key: 'when',
      header: 'Date / Time',
      render: (b) => <span>{formatDate(b.date)}<br /><span className="text-xs text-ink-400">{formatTime(b.startTime)}–{formatTime(b.endTime)}</span></span>,
    },
    { key: 'amount', header: 'Amount', render: (b) => money(b.amount) },
    { key: 'paymentStatus', header: 'Payment', render: (b) => <Badge status={b.paymentStatus} /> },
    { key: 'status', header: 'Booking Status', render: (b) => <Badge status={b.status} /> },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <div className="flex flex-wrap items-center gap-2">
          {canCancelBookings && ['CONFIRMED', 'CHECKED_IN'].includes(b.status) && (
            <Button size="sm" variant="outlineDanger" icon={Ban} onClick={() => handleCancel(b)}>Cancel</Button>
          )}
          {canApproveRefunds && b.status === 'REFUND_PENDING' && (
            <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => handleApproveRefund(b)}>Approve Refund</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader title="Bookings" subtitle={`${filtered.length} of ${store.bookings.length} bookings shown`} />

      <Card className="mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput className="lg:col-span-2" value={search} onChange={setSearch} placeholder="Search by user name or email…" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.values(BOOKING_STATUS).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
          <div>
            <Label>From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        emptyTitle="No bookings match your filters"
        emptyMessage="Try widening your search, status or date range."
      />
    </div>
  );
}

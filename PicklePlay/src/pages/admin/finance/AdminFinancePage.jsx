import { useMemo, useState } from 'react';
import {
  Wallet, CheckCircle2, XCircle, Clock, RotateCcw, Percent, Landmark,
} from 'lucide-react';
import { useStore } from '../../../store';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { can, PERMISSIONS } from '../../../lib/permissions';
import { PAYMENT_STATUS } from '../../../lib/stateMachines';
import { approveRefund } from '../../../services/bookingService';
import SectionHeader from '../../../components/ui/SectionHeader';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Field';
import { EmptyState } from '../../../components/ui/States';
import { money, formatDate, formatDateTime } from '../../../lib/format';

export default function AdminFinancePage() {
  const admin = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js

  const [statusFilter, setStatusFilter] = useState('');

  const canManage = can(admin?.role, PERMISSIONS.FINANCE_MANAGE);
  const commissionPercent = store.settings?.platform?.commissionPercent ?? 0;

  const financials = useMemo(() => {
    const payments = store.payments;
    const successPayments = payments.filter((p) => p.status === 'SUCCESS');
    const totalRevenue = successPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const failedCount = payments.filter((p) => p.status === 'FAILED').length;
    const pendingCount = payments.filter((p) => ['PENDING', 'PROCESSING'].includes(p.status)).length;
    const totalRefunded = payments
      .filter((p) => ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(p.status))
      .reduce((sum, p) => {
        if (p.referenceType === 'BOOKING') {
          const booking = store.getBooking(p.referenceId);
          return sum + (booking?.refund?.amount ?? (Number(p.amount) || 0));
        }
        return sum + (Number(p.amount) || 0);
      }, 0);
    const commission = Math.round(totalRevenue * (commissionPercent / 100));
    const clubPayout = totalRevenue - commission;
    const examplePayment = [...successPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    const exampleCommission = examplePayment ? Math.round(examplePayment.amount * (commissionPercent / 100)) : 0;
    const exampleClub = examplePayment ? examplePayment.amount - exampleCommission : 0;
    return {
      totalRevenue, successCount: successPayments.length, failedCount, pendingCount, totalRefunded,
      commission, clubPayout, examplePayment, exampleCommission, exampleClub,
    };
  }, [store, commissionPercent]);

  const pendingRefundBookings = useMemo(
    () => store.bookings
      .filter((b) => b.status === 'REFUND_PENDING')
      .sort((a, b) => new Date(a.cancelledAt || a.createdAt) - new Date(b.cancelledAt || b.createdAt)),
    [store.bookings]
  );

  const filteredPayments = useMemo(
    () => [...store.payments]
      .filter((p) => (statusFilter ? p.status === statusFilter : true))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [store.payments, statusFilter]
  );

  const handleApproveRefund = (booking) => {
    const bUser = store.getUser(booking.userId);
    store.askConfirm({
      title: 'Approve this refund?',
      message: `${money(booking.refund?.amount)} will be refunded to ${bUser?.name || 'the player'}'s original payment method for their booking on ${formatDate(booking.date)}.`,
      confirmLabel: 'Approve Refund',
      onConfirm: () => {
        const r = approveRefund(booking.id, admin.id);
        if (!r.ok) return store.toast(r.error, 'error');
        store.toast(`Refund of ${money(booking.refund?.amount)} approved and processed.`, 'success');
      },
    });
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row) => {
        const u = store.getUser(row.userId);
        return (
          <div className="flex items-center gap-3">
            <Avatar name={u?.name} src={u?.profileImage} size="sm" />
            <p className="font-medium text-ink-900">{u?.name || '—'}</p>
          </div>
        );
      },
    },
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
    { key: 'amount', header: 'Amount', render: (row) => <span className="font-medium">{money(row.amount)}</span> },
    { key: 'method', header: 'Method', render: (row) => row.method },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div>
      <SectionHeader title="Finance" subtitle="Revenue, payments, refunds and platform commission." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <StatCard icon={Wallet} label="Total Revenue" value={money(financials.totalRevenue)} tone="brand" />
        <StatCard icon={CheckCircle2} label="Successful Payments" value={financials.successCount} tone="court" />
        <StatCard icon={XCircle} label="Failed Payments" value={financials.failedCount} tone={financials.failedCount > 0 ? 'danger' : 'ink'} />
        <StatCard icon={Clock} label="Pending Payments" value={financials.pendingCount} tone={financials.pendingCount > 0 ? 'accent' : 'ink'} />
        <StatCard icon={RotateCcw} label="Total Refunded" value={money(financials.totalRefunded)} tone={financials.totalRefunded > 0 ? 'danger' : 'ink'} />
        <StatCard icon={Percent} label="Platform Commission" value={money(financials.commission)} hint={`${commissionPercent}% of revenue`} tone="accent" />
        <StatCard icon={Landmark} label="Club Payouts" value={money(financials.clubPayout)} tone="brand" />
      </div>

      <Card className="mb-6">
        <CardHeader title="Commission Split Example" subtitle="Computed live from the most recent successful payment." />
        <CardBody>
          {financials.examplePayment ? (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Payment Amount</p>
                <p className="text-lg font-semibold text-ink-900">{money(financials.examplePayment.amount)}</p>
              </div>
              <span className="hidden text-ink-300 sm:inline">×</span>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Commission Rate</p>
                <p className="text-lg font-semibold text-ink-900">{commissionPercent}%</p>
              </div>
              <span className="hidden text-ink-300 sm:inline">=</span>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Platform Gets</p>
                <p className="text-lg font-semibold text-brand-700">{money(financials.exampleCommission)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Club Gets</p>
                <p className="text-lg font-semibold text-court-700">{money(financials.exampleClub)}</p>
              </div>
              <p className="w-full border-t border-ink-100 pt-2 text-xs text-ink-400">
                Based on payment <span className="font-medium text-ink-600">{financials.examplePayment.id}</span> ({financials.examplePayment.referenceType} {financials.examplePayment.referenceId}) by {store.getUser(financials.examplePayment.userId)?.name || 'a player'} on {formatDate(financials.examplePayment.createdAt)}.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-400">No successful payments yet to illustrate the commission split.</p>
          )}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Pending Refunds"
          subtitle={`${pendingRefundBookings.length} booking${pendingRefundBookings.length === 1 ? '' : 's'} awaiting refund approval`}
        />
        <CardBody className="space-y-3">
          {pendingRefundBookings.length === 0 ? (
            <EmptyState icon={RotateCcw} title="No pending refunds" message="Cancelled bookings that qualify for a refund will show up here for approval." />
          ) : (
            pendingRefundBookings.map((b) => {
              const bUser = store.getUser(b.userId);
              const club = store.getClub(b.clubId);
              const court = store.getCourt(b.courtId);
              return (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={bUser?.name} src={bUser?.profileImage} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-ink-800">{bUser?.name}</p>
                      <p className="text-xs text-ink-500">{club?.name} · {court?.name} · {formatDate(b.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">{money(b.refund?.amount)}</p>
                      <p className="text-xs text-ink-400">{b.refund?.percent}% refund</p>
                    </div>
                    {canManage ? (
                      <Button size="sm" variant="court" icon={RotateCcw} onClick={() => handleApproveRefund(b)}>Approve Refund</Button>
                    ) : (
                      <Badge status="REFUND_PENDING" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <SectionHeader
        title="All Payments"
        subtitle={`${filteredPayments.length} of ${store.payments.length} shown`}
        action={(
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
            <option value="">All Statuses</option>
            {Object.values(PAYMENT_STATUS).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
        )}
      />
      <DataTable
        columns={columns}
        rows={filteredPayments}
        emptyTitle="No payments found"
        emptyMessage={statusFilter ? 'Try a different status filter.' : 'Payments will appear here as players book courts, join games and register for tournaments.'}
      />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, XCircle, CalendarX2, Undo2 } from 'lucide-react';
import { useStore } from '../../store';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { cancelBooking } from '../../services/bookingService';
import SectionHeader from '../../components/ui/SectionHeader';
import Tabs from '../../components/ui/Tabs';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatTime, money } from '../../lib/format';

const TERMINAL_STATUSES = ['CANCELLED', 'COMPLETED', 'REFUNDED', 'REFUND_PENDING', 'PAYMENT_FAILED'];

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const store = useStore(); // whole-store subscription — see note in store/index.js
  const { toast, askConfirm } = store;
  const [tab, setTab] = useState('upcoming');

  const bookings = user ? store.bookingsForUser(user.id) : [];
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = bookings.filter((b) => b.date >= today && !TERMINAL_STATUSES.includes(b.status));
  const past = bookings.filter((b) => b.date < today || TERMINAL_STATUSES.includes(b.status));
  const list = tab === 'upcoming' ? upcoming : past;

  const handleCancel = (booking, club, court) => {
    askConfirm({
      title: 'Cancel this booking?',
      message: `Your slot at ${court?.name} (${club?.name}) on ${formatDate(booking.date)} will be released. Any eligible refund is calculated automatically based on the cancellation policy.`,
      confirmLabel: 'Cancel Booking',
      tone: 'danger',
      onConfirm: () => {
        const result = cancelBooking(booking.id, user.id);
        if (!result.ok) return toast(result.error, 'error');
        const { refund } = result;
        toast(
          refund.amount > 0
            ? `Booking cancelled. You'll receive a ${refund.percent}% refund of ${money(refund.amount)}.`
            : `Booking cancelled. No refund applies (cancelled ${refund.hoursBefore}h before start time).`,
          'success'
        );
      },
    });
  };

  return (
    <div>
      <SectionHeader title="My Bookings" subtitle="Your court bookings, past and upcoming." action={<Button onClick={() => navigate('/courts')}>Book a Court</Button>} />
      <Tabs tabs={[{ value: 'upcoming', label: 'Upcoming', count: upcoming.length }, { value: 'past', label: 'Past', count: past.length }]} active={tab} onChange={setTab} className="mb-5" />

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'upcoming' ? Calendar : CalendarX2}
          title={`No ${tab} bookings`}
          message={tab === 'upcoming' ? 'Browse clubs and book a court to get started.' : 'Your completed and cancelled bookings will show up here.'}
          action={tab === 'upcoming' ? <Button onClick={() => navigate('/courts')}>Browse Clubs</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((b) => {
            const club = store.getClub(b.clubId);
            const court = store.getCourt(b.courtId);
            const canCancel = b.status === 'CONFIRMED';
            return (
              <Card key={b.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{club?.name || 'Club'}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500"><MapPin className="size-3.5 shrink-0" /> {court?.name}</p>
                    </div>
                    <Badge status={b.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                    <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {formatDate(b.date)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
                    <span className="text-ink-500">Amount Paid</span>
                    <span className="font-semibold text-ink-800">{money(b.amount)}</span>
                  </div>

                  {b.refund && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-court-50 px-3 py-2 text-xs text-court-700">
                      <Undo2 className="size-3.5 shrink-0" />
                      {b.status === 'REFUNDED'
                        ? `Refunded ${money(b.refund.amount)} (${b.refund.percent}%).`
                        : b.status === 'REFUND_PENDING'
                          ? `Refund pending: ${money(b.refund.amount)} (${b.refund.percent}%).`
                          : b.refund.amount > 0
                            ? `${b.refund.percent}% refund of ${money(b.refund.amount)} was applied.`
                            : 'No refund applied for this cancellation.'}
                    </div>
                  )}

                  {canCancel && (
                    <Button variant="outlineDanger" icon={XCircle} className="w-full" onClick={() => handleCancel(b, club, court)}>
                      Cancel Booking
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

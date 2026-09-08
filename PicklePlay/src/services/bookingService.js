import { useStore } from '../store';
import { quoteCourtPrice } from '../lib/pricing';
import { calculateRefund } from '../lib/refundEngine';
import { notify } from './notificationService';

export function getQuote(courtId, date, startTime, endTime) {
  const store = useStore.getState();
  const court = store.getCourt(courtId);
  if (!court) return null;
  return quoteCourtPrice(court, date, startTime, endTime);
}

/** Full "Select → Payment → Confirm" flow from Spec Section 17/19. */
export function bookCourt({ userId, clubId, courtId, date, startTime, endTime }, forcePaymentOutcome = 'SUCCESS') {
  const store = useStore.getState();
  const user = store.getUser(userId);
  const club = store.getClub(clubId);
  const court = store.getCourt(courtId);

  if (!user || user.status !== 'ACTIVE') return { ok: false, error: 'Your account cannot book courts right now.' };
  if (!club || club.status !== 'ACTIVE') return { ok: false, error: 'This club is not currently accepting bookings.' };
  if (!court) return { ok: false, error: 'Court not found.' };
  if (court.status === 'MAINTENANCE') return { ok: false, error: 'This court is under maintenance.' };
  if (court.status === 'BLOCKED') return { ok: false, error: 'This court is currently blocked by the club.' };
  if (startTime >= endTime) return { ok: false, error: 'End time must be after start time.' };

  const maxAdvance = store.settings?.booking?.maxAdvanceBookingDays ?? 30;
  const daysOut = (new Date(date) - new Date(new Date().toDateString())) / 86400000;
  if (daysOut > maxAdvance) return { ok: false, error: `Bookings can only be made up to ${maxAdvance} days in advance.` };
  if (daysOut < 0) return { ok: false, error: 'Cannot book a slot in the past.' };

  if (!store.isCourtSlotFree(courtId, date, startTime, endTime)) {
    return { ok: false, error: 'COURT_NOT_AVAILABLE', alternatives: suggestAlternatives(clubId, date, startTime, endTime, courtId) };
  }

  const quote = quoteCourtPrice(court, date, startTime, endTime);
  const booking = store.createBookingRecord({ userId, clubId, courtId, date, startTime, endTime, amount: quote.amount });
  store.transitionBooking(booking.id, 'PAYMENT_PENDING');

  const payment = store.createPayment({ userId, referenceType: 'BOOKING', referenceId: booking.id, amount: quote.amount });
  const outcome = store.processPayment(payment.id, forcePaymentOutcome);

  if (outcome === 'SUCCESS') {
    store.transitionBooking(booking.id, 'CONFIRMED');
    store.patchBooking(booking.id, { paymentId: payment.id, paymentStatus: 'SUCCESS' });
    notify(userId, 'Booking Confirmed', `${court.name} at ${club.name} booked for ${date}, ${startTime}-${endTime}.`, 'BOOKING_CONFIRMATION', 'BOOKING', booking.id);
    return { ok: true, booking: store.getBooking(booking.id), quote };
  }

  store.transitionBooking(booking.id, 'PAYMENT_FAILED');
  store.patchBooking(booking.id, { paymentId: payment.id, paymentStatus: 'FAILED' });
  store.transitionBooking(booking.id, 'AVAILABLE');
  notify(userId, 'Payment Failed', `Payment for ${court.name} booking could not be processed.`, 'PAYMENT_FAILURE', 'BOOKING', booking.id);
  return { ok: false, error: 'Payment failed. Please try again.' };
}

function suggestAlternatives(clubId, date, startTime, endTime, excludeCourtId) {
  const store = useStore.getState();
  return store.courtsForClub(clubId)
    .filter((c) => c.id !== excludeCourtId && c.status === 'AVAILABLE')
    .filter((c) => store.isCourtSlotFree(c.id, date, startTime, endTime))
    .slice(0, 4);
}

/** Cancellation → refund-rule calculation → (pending) refund record, per
 *  Spec Section 21/57. Finance Admin finalizes via approveRefund(). */
export function cancelBooking(bookingId, actingUserId, isAdmin = false) {
  const store = useStore.getState();
  const booking = store.getBooking(bookingId);
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (!isAdmin && booking.userId !== actingUserId) return { ok: false, error: 'You can only cancel your own bookings.' };
  if (!['CONFIRMED', 'CHECKED_IN'].includes(booking.status)) return { ok: false, error: `Booking cannot be cancelled from status ${booking.status}.` };

  store.transitionBooking(bookingId, 'CANCEL_REQUESTED');
  store.transitionBooking(bookingId, 'CANCELLED');
  store.patchBooking(bookingId, { cancelledAt: new Date().toISOString() });

  const rules = store.settings?.booking?.refundRules ?? [];
  const scheduledAt = `${booking.date}T${booking.startTime}:00`;
  const refund = calculateRefund(booking.amount, scheduledAt, rules);
  store.patchBooking(bookingId, { refund });

  if (refund.amount > 0) {
    store.transitionBooking(bookingId, 'REFUND_PENDING');
    notify(booking.userId, 'Refund Pending', `Your cancellation qualifies for a ${refund.percent}% refund (₹${refund.amount}). Processing shortly.`, 'REFUND_STATUS', 'BOOKING', bookingId);
  } else {
    notify(booking.userId, 'Booking Cancelled', `Your booking was cancelled. No refund applies (cancelled ${refund.hoursBefore}h before start).`, 'BOOKING_CANCELLED', 'BOOKING', bookingId);
  }

  if (isAdmin) store.logAudit(actingUserId, 'BOOKING_CANCELLED', 'Bookings', bookingId, booking.status, 'CANCELLED');
  return { ok: true, refund };
}

/** Finance Admin action: finalize a pending refund. */
export function approveRefund(bookingId, adminId) {
  const store = useStore.getState();
  const booking = store.getBooking(bookingId);
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.status !== 'REFUND_PENDING') return { ok: false, error: 'This booking has no pending refund.' };

  if (booking.paymentId) store.refundPayment(booking.paymentId, booking.refund.amount, adminId);
  store.transitionBooking(bookingId, 'REFUNDED');
  notify(booking.userId, 'Refund Processed', `₹${booking.refund.amount} has been refunded to your original payment method.`, 'REFUND_STATUS', 'BOOKING', bookingId);
  return { ok: true };
}

export function checkInBooking(bookingId) {
  const store = useStore.getState();
  return store.transitionBooking(bookingId, 'CHECKED_IN');
}

export function completeBooking(bookingId) {
  const store = useStore.getState();
  return store.transitionBooking(bookingId, 'COMPLETED');
}

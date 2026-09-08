import { genBookingId } from '../../lib/id';
import { BOOKING_STATUS, assertTransition, BOOKING_TRANSITIONS } from '../../lib/stateMachines';

export const createBookingsSlice = (set, get) => ({
  bookings: [],

  getBooking: (bookingId) => get().bookings.find((b) => b.id === bookingId) || null,
  bookingsForUser: (userId) => get().bookings.filter((b) => b.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date)),
  bookingsForCourt: (courtId, date) => {
    const OCCUPYING = ['HOLD', 'PAYMENT_PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'];
    return get().bookings.filter((b) => b.courtId === courtId && b.date === date && OCCUPYING.includes(b.status));
  },

  isCourtSlotFree: (courtId, date, startTime, endTime, excludeBookingId = null) => {
    const overlapping = get().bookingsForCourt(courtId, date).some((b) => {
      if (b.id === excludeBookingId) return false;
      return startTime < b.endTime && endTime > b.startTime;
    });
    return !overlapping;
  },

  createBookingRecord: ({ userId, clubId, courtId, date, startTime, endTime, amount }) => {
    const booking = {
      id: genBookingId(), userId, clubId, courtId, date, startTime, endTime, amount,
      paymentId: null, paymentStatus: 'PENDING', status: BOOKING_STATUS.HOLD,
      createdAt: new Date().toISOString(), cancelledAt: null, refund: null,
    };
    set((state) => { state.bookings.push(booking); });
    return booking;
  },

  transitionBooking: (bookingId, toStatus) => {
    const booking = get().getBooking(bookingId);
    if (!booking) return { ok: false, error: 'Booking not found.' };
    try {
      assertTransition(BOOKING_TRANSITIONS, booking.status, toStatus, 'booking');
    } catch (e) {
      return { ok: false, error: e.message };
    }
    set((state) => {
      const b = state.bookings.find((x) => x.id === bookingId);
      if (b) b.status = toStatus;
    });
    return { ok: true };
  },

  patchBooking: (bookingId, patch) => {
    set((state) => {
      const b = state.bookings.find((x) => x.id === bookingId);
      if (b) Object.assign(b, patch);
    });
  },
});

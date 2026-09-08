import { genPaymentId } from '../../lib/id';
import { PAYMENT_STATUS } from '../../lib/stateMachines';

export const createPaymentsSlice = (set, get) => ({
  payments: [],

  getPayment: (paymentId) => get().payments.find((p) => p.id === paymentId) || null,
  paymentsForUser: (userId) => get().payments.filter((p) => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  createPayment: ({ userId, referenceType, referenceId, amount, method = 'UPI' }) => {
    const payment = {
      id: genPaymentId(), userId, referenceType, referenceId, amount, method,
      transactionId: null, status: PAYMENT_STATUS.PENDING, createdAt: new Date().toISOString(),
    };
    set((state) => { state.payments.push(payment); });
    return payment;
  },

  /** Simulated payment gateway (Spec Section 20). `forceOutcome` lets the UI
   *  drive the SUCCESS/FAILED demo toggle; otherwise it's weighted random. */
  processPayment: (paymentId, forceOutcome = null) => {
    const outcome = forceOutcome || (Math.random() < 0.9 ? 'SUCCESS' : 'FAILED');
    set((state) => {
      const p = state.payments.find((x) => x.id === paymentId);
      if (p) {
        p.status = outcome === 'SUCCESS' ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED;
        p.transactionId = outcome === 'SUCCESS' ? `TXN${Date.now().toString().slice(-8)}` : null;
      }
    });
    return outcome;
  },

  refundPayment: (paymentId, amount, adminId) => {
    const payment = get().getPayment(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (amount > payment.amount) return { ok: false, error: 'Refund cannot exceed paid amount.' };
    const full = amount === payment.amount;
    set((state) => {
      const p = state.payments.find((x) => x.id === paymentId);
      if (p) p.status = full ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
    });
    if (adminId) get().logAudit(adminId, 'REFUND_PROCESSED', 'Finance', paymentId, payment.status, full ? 'REFUNDED' : 'PARTIALLY_REFUNDED');
    return { ok: true };
  },
});

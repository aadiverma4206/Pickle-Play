// Refund engine (Spec Section 21). Rules are read from Settings, never
// hard-coded, and are shared by bookings, games, tournaments and events.

/**
 * rules: sorted array like
 * [{ minHours: 24, percent: 100 }, { minHours: 12, percent: 50 }, { minHours: 0, percent: 0 }]
 */
export function calculateRefund(amount, scheduledAtISO, rules, nowISO = new Date().toISOString()) {
  const amt = Number(amount) || 0;
  if (amt <= 0) return { percent: 0, amount: 0, hoursBefore: 0 };

  const scheduled = new Date(scheduledAtISO).getTime();
  const now = new Date(nowISO).getTime();
  const hoursBefore = Math.max(0, (scheduled - now) / (1000 * 60 * 60));

  const sorted = [...(rules || [])].sort((a, b) => b.minHours - a.minHours);
  const matched = sorted.find((r) => hoursBefore >= r.minHours) || sorted[sorted.length - 1] || { percent: 0 };

  const refundAmount = Math.round((amt * matched.percent) / 100);
  return { percent: matched.percent, amount: Math.min(refundAmount, amt), hoursBefore: Math.round(hoursBefore * 10) / 10 };
}

export const DEFAULT_REFUND_RULES = [
  { minHours: 24, percent: 100 },
  { minHours: 12, percent: 50 },
  { minHours: 0, percent: 0 },
];

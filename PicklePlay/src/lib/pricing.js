// Dynamic court pricing (Spec Section 18). Rates are configurable per-court;
// nothing here is hard-coded per business rule — only the *shape* of the rule
// (peak window / weekend multiplier) is fixed.

/**
 * court.pricing = {
 *   base: 400,
 *   peakMultiplier: 1.5,       // applied inside peak windows
 *   weekendMultiplier: 1.75,   // applied on Sat/Sun (stacks are avoided — max() is used)
 *   peakWindows: [{ start: '17:00', end: '21:00' }],
 * }
 */
export function quoteCourtPrice(court, dateISO, startTime, endTime) {
  const pricing = court?.pricing || { base: court?.pricePerHour || 400, peakMultiplier: 1, weekendMultiplier: 1, peakWindows: [] };
  const base = pricing.base ?? court?.pricePerHour ?? 400;
  const day = new Date(dateISO + 'T00:00:00');
  const isWeekend = [0, 6].includes(day.getDay());
  const isPeak = (pricing.peakWindows || []).some((w) => timeInWindow(startTime, w.start, w.end));

  let multiplier = 1;
  let label = 'Normal';
  if (isWeekend && isPeak) {
    multiplier = Math.max(pricing.weekendMultiplier ?? 1, pricing.peakMultiplier ?? 1);
    label = 'Weekend Peak';
  } else if (isWeekend) {
    multiplier = pricing.weekendMultiplier ?? 1;
    label = 'Weekend';
  } else if (isPeak) {
    multiplier = pricing.peakMultiplier ?? 1;
    label = 'Peak';
  }

  const hours = durationHours(startTime, endTime);
  const ratePerHour = Math.round(base * multiplier);
  const amount = Math.round(ratePerHour * hours);
  return { ratePerHour, hours, amount, label, isWeekend, isPeak };
}

function timeInWindow(time, start, end) {
  return time >= start && time < end;
}

export function durationHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, mins / 60);
}

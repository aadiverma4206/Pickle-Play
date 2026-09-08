// Configurable Elo-style skill rating engine (Spec Section 34).

const DEFAULT_K = 32;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Returns { winnerNewRating, loserNewRating, winnerDelta, loserDelta }
 */
export function applyEloUpdate(winnerRating, loserRating, k = DEFAULT_K) {
  const expectedWinner = expectedScore(winnerRating, loserRating);
  const expectedLoser = 1 - expectedWinner;

  const winnerDelta = Math.round(k * (1 - expectedWinner));
  const loserDelta = Math.round(k * (0 - expectedLoser));

  return {
    winnerNewRating: winnerRating + winnerDelta,
    loserNewRating: Math.max(0, loserRating + loserDelta),
    winnerDelta,
    loserDelta,
  };
}

// Community / sportsmanship rating is a simple 1-5 running average, separate
// from skill rating per Spec Section 34.
export function applyCommunityRatingUpdate(currentAvg, currentCount, newScore) {
  const count = currentCount || 0;
  const avg = currentAvg || 5;
  const nextCount = count + 1;
  const nextAvg = (avg * count + newScore) / nextCount;
  return { avg: Math.round(nextAvg * 10) / 10, count: nextCount };
}

// Reliability score (Spec Section 35) — simple weighted formula, kept
// configurable via settings for penalty weights.
export function computeReliability({ attended = 0, cancellations = 0, noShows = 0 }, weights = { cancel: 4, noShow: 10 }) {
  const total = attended + cancellations + noShows;
  if (total === 0) return 100;
  const penalty = cancellations * weights.cancel + noShows * weights.noShow;
  const score = 100 - penalty / Math.max(1, total / 5);
  return Math.max(0, Math.min(100, Math.round(score)));
}

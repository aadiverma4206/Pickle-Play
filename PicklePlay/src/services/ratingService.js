import { useStore } from '../store';
import { applyEloUpdate } from '../lib/ratingEngine';
import { notify } from './notificationService';

/**
 * Applies the full "match completed" propagation chain from Spec Section 30 /
 * 63 for a single winner/loser pair (called once per opposing pair — for
 * doubles, call once per cross-team pairing so every player's rating moves):
 *   RESULT → PLAYER WIN/LOSS → RATING → PERFORMANCE → STREAK → ACHIEVEMENTS → NOTIFICATION
 */
export function applyMatchOutcome({ winnerId, loserId, winnerPoints, loserPoints, isDoubles = false, isTournament = false, contextLabel }) {
  const store = useStore.getState();
  const winnerRating = store.getRating(winnerId);
  const loserRating = store.getRating(loserId);
  if (!winnerRating || !loserRating) return;

  const k = store.settings?.rating?.kFactor ?? 32;
  const { winnerNewRating, loserNewRating, winnerDelta, loserDelta } = applyEloUpdate(winnerRating.skillRating, loserRating.skillRating, k);

  store.applyRatingDelta(winnerId, winnerDelta);
  store.applyRatingDelta(loserId, loserDelta);

  store.recordMatchOutcome(winnerId, { won: true, pointsFor: winnerPoints, pointsAgainst: loserPoints, isDoubles, isTournament });
  store.recordMatchOutcome(loserId, { won: false, pointsFor: loserPoints, pointsAgainst: winnerPoints, isDoubles, isTournament });

  notify(winnerId, 'Match Result', `You won ${contextLabel || 'your match'}! Rating ${winnerDelta >= 0 ? '+' : ''}${winnerDelta} → ${winnerNewRating}.`, 'MATCH_RESULT');
  notify(loserId, 'Match Result', `You lost ${contextLabel || 'your match'}. Rating ${loserDelta} → ${loserNewRating}.`, 'MATCH_RESULT');
  notify(winnerId, 'Rating Update', `Your skill rating is now ${winnerNewRating}.`, 'RATING_UPDATE');
  notify(loserId, 'Rating Update', `Your skill rating is now ${loserNewRating}.`, 'RATING_UPDATE');

  for (const uid of [winnerId, loserId]) {
    const earned = store.evaluateAchievements(uid);
    earned.forEach((a) => notify(uid, 'Achievement Unlocked', `You earned the "${a.name}" badge! ${a.icon}`, 'ACHIEVEMENT_UNLOCKED', 'ACHIEVEMENT', a.id));
  }
}

export function applyTournamentWinToChampion(userId, tournamentName) {
  const store = useStore.getState();
  store.updatePerformance(userId, { titles: (store.getPerformance(userId)?.titles || 0) + 1 });
  const earned = store.evaluateAchievements(userId);
  notify(userId, 'Tournament Winner', `Congratulations on winning ${tournamentName}!`, 'TOURNAMENT_WINNER');
  earned.forEach((a) => notify(userId, 'Achievement Unlocked', `You earned the "${a.name}" badge! ${a.icon}`, 'ACHIEVEMENT_UNLOCKED', 'ACHIEVEMENT', a.id));
}

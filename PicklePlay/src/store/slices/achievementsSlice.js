export const createAchievementsSlice = (set, get) => ({
  achievements: [],
  userAchievements: [],

  achievementsForUser: (userId) => {
    const earnedIds = get().userAchievements.filter((ua) => ua.userId === userId).map((ua) => ua.achievementId);
    return get().achievements.map((a) => ({ ...a, earned: earnedIds.includes(a.id), earnedAt: get().userAchievements.find((ua) => ua.userId === userId && ua.achievementId === a.id)?.achievedAt }));
  },

  hasAchievement: (userId, achievementId) => get().userAchievements.some((ua) => ua.userId === userId && ua.achievementId === achievementId),

  awardAchievement: (userId, achievementId) => {
    if (get().hasAchievement(userId, achievementId)) return null;
    const award = { id: `ua-${Date.now()}-${achievementId}`, userId, achievementId, achievedAt: new Date().toISOString() };
    set((state) => { state.userAchievements.push(award); });
    return award;
  },

  /** Evaluate the full achievement catalog for a user against their current
   *  performance/rating snapshot, and award anything newly earned. Returns
   *  the list of newly-awarded achievements so callers can notify. */
  evaluateAchievements: (userId) => {
    const perf = get().getPerformance(userId);
    const rating = get().getRating(userId);
    const communities = get().communitiesForUser(userId).length;
    if (!perf || !rating) return [];
    const newly = [];
    for (const a of get().achievements) {
      if (get().hasAchievement(userId, a.id)) continue;
      let earned = false;
      switch (a.conditionType) {
        case 'MATCHES_PLAYED': earned = perf.matchesPlayed >= a.conditionValue; break;
        case 'WINS': earned = perf.wins >= a.conditionValue; break;
        case 'STREAK': earned = perf.longestStreak >= a.conditionValue; break;
        case 'TOURNAMENT_WIN': earned = perf.tournamentWins >= a.conditionValue; break;
        case 'COMMUNITIES_JOINED': earned = communities >= a.conditionValue; break;
        case 'DOUBLES_PLAYED': earned = (perf.doublesMatches || 0) >= a.conditionValue; break;
        case 'RATING_GAIN': {
          const hist = rating.ratingHistory || [];
          earned = hist.length > 0 && (rating.skillRating - hist[0].rating) >= a.conditionValue;
          break;
        }
        default: earned = false;
      }
      if (earned) {
        const award = get().awardAchievement(userId, a.id);
        if (award) newly.push(a);
      }
    }
    return newly;
  },
});

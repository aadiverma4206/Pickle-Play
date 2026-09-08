export const createPerformanceSlice = (set, get) => ({
  performance: [],
  ratings: [],

  getPerformance: (userId) => get().performance.find((p) => p.userId === userId) || null,
  getRating: (userId) => get().ratings.find((r) => r.userId === userId) || null,

  updatePerformance: (userId, patch) => {
    set((state) => {
      const p = state.performance.find((x) => x.userId === userId);
      if (p) Object.assign(p, patch, { lastUpdated: new Date().toISOString() });
    });
  },

  recordMatchOutcome: (userId, { won, pointsFor, pointsAgainst, isDoubles, isTournament }) => {
    set((state) => {
      const p = state.performance.find((x) => x.userId === userId);
      if (!p) return;
      p.matchesPlayed += 1;
      if (isDoubles) p.doublesMatches = (p.doublesMatches || 0) + 1;
      if (won) { p.wins += 1; p.currentStreak = p.currentStreak >= 0 ? p.currentStreak + 1 : 1; }
      else { p.losses += 1; p.currentStreak = p.currentStreak <= 0 ? p.currentStreak - 1 : -1; }
      p.longestStreak = Math.max(p.longestStreak, p.currentStreak);
      p.winRate = Math.round((p.wins / p.matchesPlayed) * 100);
      p.pointsScored += pointsFor || 0;
      p.pointsConceded += pointsAgainst || 0;
      if (isTournament) p.tournamentMatches += 1;
      p.lastUpdated = new Date().toISOString();
    });
  },

  setRating: (userId, skillRating, adminId, reason) => {
    const rating = get().getRating(userId);
    if (!rating) return { ok: false, error: 'Rating record not found.' };
    const before = rating.skillRating;
    set((state) => {
      const r = state.ratings.find((x) => x.userId === userId);
      if (r) {
        r.skillRating = skillRating;
        r.ratingHistory = [...r.ratingHistory, { date: new Date().toISOString().slice(0, 10), rating: skillRating }];
        r.lastUpdated = new Date().toISOString();
      }
    });
    if (adminId) get().logAudit(adminId, 'RATING_ADJUSTED', 'Ratings', userId, String(before), String(skillRating), reason);
    return { ok: true };
  },

  applyRatingDelta: (userId, delta) => {
    set((state) => {
      const r = state.ratings.find((x) => x.userId === userId);
      if (!r) return;
      r.skillRating = Math.max(0, r.skillRating + delta);
      r.ratingHistory = [...r.ratingHistory, { date: new Date().toISOString().slice(0, 10), rating: r.skillRating }];
      r.lastUpdated = new Date().toISOString();
    });
  },

  applyCommunityRating: (userId, avg, count) => {
    set((state) => {
      const r = state.ratings.find((x) => x.userId === userId);
      if (r) { r.communityRating = avg; r.communityRatingCount = count; }
    });
  },

  setReliabilityScore: (userId, score) => {
    set((state) => {
      const r = state.ratings.find((x) => x.userId === userId);
      if (r) r.reliabilityScore = score;
    });
  },

  leaderboard: ({ city, skillLevel, communityId, limit = 50 } = {}) => {
    const { users, ratings, communityMembers } = get();
    let pool = users.filter((u) => u.role === 'PLAYER' && u.status === 'ACTIVE');
    if (city) pool = pool.filter((u) => u.city === city);
    if (skillLevel) pool = pool.filter((u) => u.skillLevel === skillLevel);
    if (communityId) {
      const memberIds = communityMembers.filter((m) => m.communityId === communityId && m.status === 'ACTIVE').map((m) => m.userId);
      pool = pool.filter((u) => memberIds.includes(u.id));
    }
    return pool
      .map((u) => ({ user: u, rating: ratings.find((r) => r.userId === u.id), performance: get().getPerformance(u.id) }))
      .filter((row) => row.rating)
      .sort((a, b) => b.rating.skillRating - a.rating.skillRating)
      .slice(0, limit)
      .map((row, idx) => ({ rank: idx + 1, ...row }));
  },
});

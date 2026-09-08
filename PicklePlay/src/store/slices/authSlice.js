// Auth + session. The actual `users` array lives in usersSlice; this slice
// only owns "who is logged in" and the auth-facing actions.
import { genUserId } from '../../lib/id';

export const createAuthSlice = (set, get) => ({
  currentUserId: null,
  authStatus: 'AUTHENTICATED', // AUTHENTICATED | GUEST — prototype starts logged in as usr-1

  currentUser: () => {
    const { currentUserId, users } = get();
    return users.find((u) => u.id === currentUserId) || null;
  },

  login: (email, password) => {
    const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, error: 'No account found with this email.' };
    if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      return { ok: false, error: `Your account is ${user.status.toLowerCase()}. Contact support.` };
    }
    set({ currentUserId: user.id, authStatus: 'AUTHENTICATED' });
    return { ok: true, user };
  },

  logout: () => set({ currentUserId: null, authStatus: 'GUEST' }),

  /** Prototype-only convenience: instantly switch the active session to any
   *  seeded account so every role (Super Admin, Club Manager, …) can be
   *  demoed without juggling passwords. A real backend would remove this. */
  devSwitchUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: 'User not found.' };
    set({ currentUserId: userId, authStatus: 'AUTHENTICATED' });
    return { ok: true, user };
  },

  signup: ({ name, mobile, email, password, city }) => {
    const exists = get().users.some((u) => u.email.toLowerCase() === email.toLowerCase() || u.mobile === mobile);
    if (exists) return { ok: false, error: 'An account with this email or mobile already exists.' };
    const newUser = {
      id: genUserId(), role: 'PLAYER', name, email, mobile, password, city,
      area: '', profileImage: null, gender: '', dob: '', skillLevel: 'Beginner',
      playingHand: 'Right', bio: '', status: 'ACTIVE', createdAt: new Date().toISOString(),
      profileComplete: false,
    };
    set((state) => {
      state.users.push(newUser);
      state.ratings.push({ userId: newUser.id, skillRating: 800, ratingHistory: [{ date: newUser.createdAt.slice(0, 10), rating: 800 }], communityRating: 5, communityRatingCount: 0, reliabilityScore: 100, lastUpdated: newUser.createdAt });
      state.performance.push({ userId: newUser.id, matchesPlayed: 0, wins: 0, losses: 0, winRate: 0, currentStreak: 0, longestStreak: 0, pointsScored: 0, pointsConceded: 0, tournamentMatches: 0, tournamentWins: 0, finals: 0, titles: 0, matchHistory: [], lastUpdated: newUser.createdAt });
      state.currentUserId = newUser.id;
      state.authStatus = 'AUTHENTICATED';
    });
    return { ok: true, user: newUser };
  },

  completeProfileSetup: (patch) => {
    const id = get().currentUserId;
    set((state) => {
      const u = state.users.find((x) => x.id === id);
      if (u) Object.assign(u, patch, { profileComplete: true });
    });
  },
});

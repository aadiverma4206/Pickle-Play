import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { buildSeed } from '../data/seed';
import { createAuthSlice } from './slices/authSlice';
import { createUsersSlice } from './slices/usersSlice';
import { createClubsSlice } from './slices/clubsSlice';
import { createBookingsSlice } from './slices/bookingsSlice';
import { createPaymentsSlice } from './slices/paymentsSlice';
import { createGamesSlice } from './slices/gamesSlice';
import { createTournamentsSlice } from './slices/tournamentsSlice';
import { createCommunitySlice } from './slices/communitySlice';
import { createPerformanceSlice } from './slices/performanceSlice';
import { createAchievementsSlice } from './slices/achievementsSlice';
import { createNotificationsSlice } from './slices/notificationsSlice';
import { createSupportSlice } from './slices/supportSlice';
import { createAuditSlice } from './slices/auditSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createUiSlice } from './slices/uiSlice';

// Bump whenever the seed/entity shape changes materially — guards against a
// stale localStorage snapshot from an earlier prototype iteration breaking
// the app (Spec 64: "Refreshing the prototype does not destroy local state",
// which assumes the *shape* of that state is still valid).
export const SEED_VERSION = 6;

export const useStore = create()(
  persist(
    immer((...a) => ({
      ...createAuthSlice(...a),
      ...createUsersSlice(...a),
      ...createClubsSlice(...a),
      ...createBookingsSlice(...a),
      ...createPaymentsSlice(...a),
      ...createGamesSlice(...a),
      ...createTournamentsSlice(...a),
      ...createCommunitySlice(...a),
      ...createPerformanceSlice(...a),
      ...createAchievementsSlice(...a),
      ...createNotificationsSlice(...a),
      ...createSupportSlice(...a),
      ...createAuditSlice(...a),
      ...createSettingsSlice(...a),
      ...createUiSlice(...a),

      resetToSeed: () => a[0](() => ({ ...buildSeed() })),
    })),
    {
      name: 'pickleplay-storage-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // eslint-disable-next-line no-unused-vars
        const { toasts, confirmDialog, ...persisted } = state;
        return persisted;
      },
    }
  )
);

/**
 * IMPORTANT — component usage convention:
 *
 * Call `const store = useStore();` (NO selector) in page/feature components,
 * then read everything off it: raw fields as `store.games`, derived joins as
 * `store.gamesJoinedBy(userId)`, actions as `store.joinGame` (or import the
 * service functions directly). Do NOT write `useStore(s => s.someGetter(x))`
 * — our getters build fresh arrays/objects on every call (`.filter`/`.map`),
 * and Zustand's selector subscription (useSyncExternalStore under the hood)
 * requires getSnapshot to be referentially stable when nothing changed. A
 * selector that returns a new array every call trips "Maximum update depth
 * exceeded" — an infinite render loop, not a lint nit.
 *
 * Subscribing to the whole store is safe and cheap here: the persist+immer
 * middleware only produces a new root state object when a `set()` call
 * actually mutates something, so `useStore()`'s default identity comparison
 * behaves exactly like useSyncExternalStore wants — stable when idle, a
 * fresh reference exactly when something real changed. The trade-off is
 * coarser re-renders (a page re-renders on any store change, not just the
 * slice it reads), which is a fine trade for a prototype at this scale.
 * `useShallow` (imported below) is available for a narrow hot-path if one
 * ever shows up, but it is NOT the default pattern — plain `useStore()` is.
 */
export { useShallow };

/** Called once at app boot (see main.jsx). Seeds fresh dummy data on first
 *  run, and transparently re-seeds if the persisted shape is out of date. */
export function ensureSeeded() {
  const state = useStore.getState();
  if (!state.users || state.users.length === 0 || state.seedVersion !== SEED_VERSION) {
    useStore.setState({ ...buildSeed() });
  }
}

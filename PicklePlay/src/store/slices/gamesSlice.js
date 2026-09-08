import { genGameId, genGamePlayerId, genGameResultId } from '../../lib/id';
import { GAME_STATUS, assertTransition, GAME_TRANSITIONS } from '../../lib/stateMachines';

export const createGamesSlice = (set, get) => ({
  games: [],
  gamePlayers: [],
  gameResults: [],

  getGame: (gameId) => get().games.find((g) => g.id === gameId) || null,
  playersForGame: (gameId) => get().gamePlayers.filter((p) => p.gameId === gameId && p.status === 'CONFIRMED').sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt)),
  waitlistForGame: (gameId) => get().gamePlayers.filter((p) => p.gameId === gameId && p.status === 'WAITLISTED').sort((a, b) => a.waitlistPosition - b.waitlistPosition),
  gamesOrganizedBy: (userId) => get().games.filter((g) => g.organizerId === userId),
  gamesJoinedBy: (userId) => {
    const gameIds = get().gamePlayers.filter((p) => p.userId === userId && p.status === 'CONFIRMED').map((p) => p.gameId);
    return get().games.filter((g) => gameIds.includes(g.id));
  },
  isUserInGame: (gameId, userId) => get().gamePlayers.some((p) => p.gameId === gameId && p.userId === userId && ['CONFIRMED', 'WAITLISTED'].includes(p.status)),
  resultForGame: (gameId) => get().gameResults.find((r) => r.gameId === gameId) || null,

  createGameRecord: (data) => {
    const game = {
      id: genGameId(), currentPlayers: 0, status: GAME_STATUS.DRAFT, isPrivate: false,
      createdAt: new Date().toISOString(), ...data,
    };
    set((state) => { state.games.push(game); });
    return game;
  },

  updateGame: (gameId, patch) => {
    set((state) => {
      const g = state.games.find((x) => x.id === gameId);
      if (g) Object.assign(g, patch);
    });
  },

  transitionGame: (gameId, toStatus) => {
    const game = get().getGame(gameId);
    if (!game) return { ok: false, error: 'Game not found.' };
    try {
      assertTransition(GAME_TRANSITIONS, game.status, toStatus, 'game');
    } catch (e) {
      return { ok: false, error: e.message };
    }
    set((state) => {
      const g = state.games.find((x) => x.id === gameId);
      if (g) g.status = toStatus;
    });
    return { ok: true };
  },

  addGamePlayer: (gameId, userId, status = 'CONFIRMED', extra = {}) => {
    const gp = {
      id: genGamePlayerId(), gameId, userId, status, joinedAt: new Date().toISOString(),
      waitlistPosition: null, paymentStatus: 'PENDING', ...extra,
    };
    set((state) => {
      state.gamePlayers.push(gp);
      const g = state.games.find((x) => x.id === gameId);
      if (g && status === 'CONFIRMED') g.currentPlayers = state.gamePlayers.filter((p) => p.gameId === gameId && p.status === 'CONFIRMED').length;
    });
    return gp;
  },

  updateGamePlayer: (gpId, patch) => {
    set((state) => {
      const gp = state.gamePlayers.find((x) => x.id === gpId);
      if (gp) Object.assign(gp, patch);
      if (gp) {
        const g = state.games.find((x) => x.id === gp.gameId);
        if (g) g.currentPlayers = state.gamePlayers.filter((p) => p.gameId === gp.gameId && p.status === 'CONFIRMED').length;
      }
    });
  },

  removeGamePlayerRecord: (gameId, userId) => {
    set((state) => {
      const gp = state.gamePlayers.find((p) => p.gameId === gameId && p.userId === userId && p.status !== 'CANCELLED');
      if (gp) gp.status = 'CANCELLED';
      const g = state.games.find((x) => x.id === gameId);
      if (g) g.currentPlayers = state.gamePlayers.filter((p) => p.gameId === gameId && p.status === 'CONFIRMED').length;
    });
  },

  recordGameResult: ({ gameId, winnerIds, loserIds, score, createdBy }) => {
    const result = { id: genGameResultId(), gameId, winnerIds, loserIds, score, createdBy, createdAt: new Date().toISOString() };
    set((state) => { state.gameResults.push(result); });
    return result;
  },

  /** Hard-delete a game and every record that only exists because of it
   *  (participation rows, result). Distinct from cancelGame (a status
   *  transition that preserves history) — this actually erases the row, so
   *  the service layer restricts it to Super Admin and refunds first. */
  deleteGameRecord: (gameId) => {
    set((state) => {
      state.games = state.games.filter((g) => g.id !== gameId);
      state.gamePlayers = state.gamePlayers.filter((p) => p.gameId !== gameId);
      state.gameResults = state.gameResults.filter((r) => r.gameId !== gameId);
    });
  },
});

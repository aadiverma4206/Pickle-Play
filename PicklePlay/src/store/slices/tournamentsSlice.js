import { genTournamentId, genRegistrationId, genMatchId, genResultId } from '../../lib/id';
import { TOURNAMENT_TRANSITIONS, assertTransition, MATCH_TRANSITIONS } from '../../lib/stateMachines';

export const createTournamentsSlice = (set, get) => ({
  tournaments: [],
  registrations: [],
  matches: [],
  matchResults: [],

  getTournament: (id) => get().tournaments.find((t) => t.id === id) || null,
  registrationsFor: (tournamentId) => get().registrations.filter((r) => r.tournamentId === tournamentId),
  registrationsForUser: (userId) => get().registrations.filter((r) => r.userId === userId || r.partnerId === userId),
  matchesFor: (tournamentId) => get().matches.filter((m) => m.tournamentId === tournamentId),
  resultForMatch: (matchId) => get().matchResults.find((r) => r.matchId === matchId) || null,
  isUserRegistered: (tournamentId, userId) => get().registrations.some((r) => r.tournamentId === tournamentId && (r.userId === userId || r.partnerId === userId) && r.status !== 'CANCELLED' && r.status !== 'WITHDRAWN'),

  createTournamentRecord: (data) => {
    const t = { id: genTournamentId(), status: 'DRAFT', createdAt: new Date().toISOString(), ...data };
    set((state) => { state.tournaments.push(t); });
    return t;
  },

  updateTournament: (id, patch) => {
    set((state) => {
      const t = state.tournaments.find((x) => x.id === id);
      if (t) Object.assign(t, patch);
    });
  },

  transitionTournament: (id, toStatus) => {
    const t = get().getTournament(id);
    if (!t) return { ok: false, error: 'Tournament not found.' };
    try {
      assertTransition(TOURNAMENT_TRANSITIONS, t.status, toStatus, 'tournament');
    } catch (e) {
      return { ok: false, error: e.message };
    }
    set((state) => {
      const tt = state.tournaments.find((x) => x.id === id);
      if (tt) tt.status = toStatus;
    });
    return { ok: true };
  },

  addRegistration: (data) => {
    const reg = { id: genRegistrationId(), registeredAt: new Date().toISOString(), ...data };
    set((state) => { state.registrations.push(reg); });
    return reg;
  },

  updateRegistration: (regId, patch) => {
    set((state) => {
      const r = state.registrations.find((x) => x.id === regId);
      if (r) Object.assign(r, patch);
    });
  },

  setMatches: (tournamentId, matchList) => {
    set((state) => {
      state.matches = state.matches.filter((m) => m.tournamentId !== tournamentId);
      state.matches.push(...matchList.map((m) => ({ id: genMatchId(), tournamentId, status: 'SCHEDULED', ...m })));
    });
  },

  updateMatch: (matchId, patch) => {
    set((state) => {
      const m = state.matches.find((x) => x.id === matchId);
      if (m) Object.assign(m, patch);
    });
  },

  transitionMatch: (matchId, toStatus) => {
    const m = get().matches.find((x) => x.id === matchId);
    if (!m) return { ok: false, error: 'Match not found.' };
    try {
      assertTransition(MATCH_TRANSITIONS, m.status, toStatus, 'match');
    } catch (e) {
      return { ok: false, error: e.message };
    }
    set((state) => {
      const mm = state.matches.find((x) => x.id === matchId);
      if (mm) mm.status = toStatus;
    });
    return { ok: true };
  },

  recordMatchResult: ({ matchId, winnerRegId, loserRegId, score }) => {
    const result = { id: genResultId(), matchId, winnerRegId, loserRegId, score, createdAt: new Date().toISOString() };
    set((state) => { state.matchResults.push(result); });
    return result;
  },
});

import { useStore } from '../store';
import { calculateRefund } from '../lib/refundEngine';
import { notify } from './notificationService';
import { applyMatchOutcome, applyTournamentWinToChampion } from './ratingService';

// ---------------------------------------------------------------------------
// Registration (Spec Section 27/28)
// ---------------------------------------------------------------------------

function capacityUsed(tournamentId) {
  const store = useStore.getState();
  return store.registrationsFor(tournamentId).filter((r) => !['CANCELLED', 'WITHDRAWN'].includes(r.status)).length;
}

function payForRegistration(registration, tournament) {
  const store = useStore.getState();
  if (tournament.entryFee <= 0) {
    store.updateRegistration(registration.id, { status: 'CONFIRMED', paymentStatus: 'N/A' });
    return { ok: true };
  }
  const payment = store.createPayment({ userId: registration.userId, referenceType: 'TOURNAMENT', referenceId: registration.id, amount: tournament.entryFee });
  const outcome = store.processPayment(payment.id, 'SUCCESS');
  if (outcome === 'SUCCESS') {
    store.updateRegistration(registration.id, { status: 'CONFIRMED', paymentStatus: 'SUCCESS', paymentId: payment.id });
    notify(registration.userId, 'Registration Confirmed', `You're registered for ${tournament.name}.`, 'TOURNAMENT_REGISTRATION', 'TOURNAMENT', tournament.id);
    if (registration.partnerId) notify(registration.partnerId, 'Registration Confirmed', `Your team is registered for ${tournament.name}.`, 'TOURNAMENT_REGISTRATION', 'TOURNAMENT', tournament.id);
    return { ok: true };
  }
  store.updateRegistration(registration.id, { paymentStatus: 'FAILED' });
  notify(registration.userId, 'Payment Failed', `Payment for ${tournament.name} failed.`, 'PAYMENT_FAILURE', 'TOURNAMENT', tournament.id);
  return { ok: false, error: 'Payment failed.' };
}

export function registerForTournament(tournamentId, userId, { partnerId = null, teamName = null } = {}) {
  const store = useStore.getState();
  const tournament = store.getTournament(tournamentId);
  const user = store.getUser(userId);
  if (!tournament) return { ok: false, error: 'Tournament not found.' };
  if (!user || user.status !== 'ACTIVE') return { ok: false, error: 'Your account cannot register right now.' };
  if (tournament.status !== 'REGISTRATION_OPEN') return { ok: false, error: 'Registration is not open for this tournament.' };
  if (new Date() > new Date(tournament.registrationEnd)) return { ok: false, error: 'Registration deadline has passed.' };
  if (store.isUserRegistered(tournamentId, userId)) return { ok: false, error: 'You are already registered for this tournament.' };
  if (partnerId && store.isUserRegistered(tournamentId, partnerId)) return { ok: false, error: 'Your partner is already registered for this tournament.' };
  if (partnerId === userId) return { ok: false, error: 'A doubles team cannot contain the same player twice.' };
  if (capacityUsed(tournamentId) >= tournament.maxParticipants) return { ok: false, error: 'Registration Full — this tournament has reached capacity.' };

  const needsPartnerFlow = tournament.category === 'Doubles' && partnerId;
  const registration = store.addRegistration({
    tournamentId, userId, partnerId: needsPartnerFlow ? partnerId : null, teamName,
    status: needsPartnerFlow ? 'TEAM_PENDING' : 'PENDING_PAYMENT', paymentStatus: 'PENDING',
  });

  if (needsPartnerFlow) {
    notify(partnerId, 'Partner Invite', `${user.name} invited you to team up for ${tournament.name}.`, 'TOURNAMENT_PARTNER_INVITE', 'TOURNAMENT', tournamentId);
    return { ok: true, registration, status: 'TEAM_PENDING' };
  }

  const result = payForRegistration(registration, tournament);
  return { ok: result.ok, registration: store.registrations.find((r) => r.id === registration.id), error: result.error };
}

export function respondToPartnerInvite(registrationId, accept) {
  const store = useStore.getState();
  const registration = store.registrations.find((r) => r.id === registrationId);
  if (!registration) return { ok: false, error: 'Invitation not found.' };
  const tournament = store.getTournament(registration.tournamentId);

  if (!accept) {
    store.updateRegistration(registrationId, { status: 'CANCELLED' });
    notify(registration.userId, 'Partner Invite Declined', `Your partner invite for ${tournament.name} was declined.`, 'TOURNAMENT_PARTNER_INVITE', 'TOURNAMENT', tournament.id);
    return { ok: true, status: 'CANCELLED' };
  }
  store.updateRegistration(registrationId, { status: 'PENDING_PAYMENT' });
  const result = payForRegistration(registration, tournament);
  return { ok: result.ok, error: result.error };
}

export function withdrawRegistration(registrationId, actingUserId) {
  const store = useStore.getState();
  const registration = store.registrations.find((r) => r.id === registrationId);
  if (!registration) return { ok: false, error: 'Registration not found.' };
  const tournament = store.getTournament(registration.tournamentId);
  if (![registration.userId, registration.partnerId].includes(actingUserId)) return { ok: false, error: 'Not authorized to withdraw this registration.' };

  store.updateRegistration(registrationId, { status: 'WITHDRAWN' });

  if (registration.paymentStatus === 'SUCCESS' && registration.paymentId) {
    const rules = store.settings?.tournament?.withdrawalRefundRules ?? [];
    const refund = calculateRefund(tournament.entryFee, tournament.startDate, rules);
    if (refund.amount > 0) store.refundPayment(registration.paymentId, refund.amount);
    notify(registration.userId, 'Withdrawal Processed', `You withdrew from ${tournament.name}. Refund: ₹${refund.amount} (${refund.percent}%).`, 'REFUND_STATUS', 'TOURNAMENT', tournament.id);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Fixtures & Brackets (Spec Section 29)
// ---------------------------------------------------------------------------

function seededTeamsFor(tournamentId) {
  const store = useStore.getState();
  return store.registrationsFor(tournamentId)
    .filter((r) => r.status === 'CONFIRMED')
    .map((r) => {
      const user = store.getUser(r.userId);
      const partner = r.partnerId ? store.getUser(r.partnerId) : null;
      return { regId: r.id, playerIds: [r.userId, ...(r.partnerId ? [r.partnerId] : [])], name: partner ? `${user.name.split(' ')[0]} / ${partner.name.split(' ')[0]}` : user.name };
    });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundLabel(roundsFromFinal) {
  if (roundsFromFinal === 0) return 'Final';
  if (roundsFromFinal === 1) return 'Semi Final';
  if (roundsFromFinal === 2) return 'Quarter Final';
  return `Round of ${Math.pow(2, roundsFromFinal + 1)}`;
}

/** Builds a full single-elimination bracket (all rounds, later rounds TBD)
 *  and auto-advances any byes. Returns the created match list. */
function buildKnockout(tournamentId, teams, courtId, startDate) {
  const store = useStore.getState();
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(2, teams.length))));
  const padded = shuffle(teams);
  while (padded.length < size) padded.push(null); // byes

  const totalRounds = Math.log2(size);
  const idsByRound = [];
  for (let r = 0; r < totalRounds; r++) {
    const count = size / Math.pow(2, r + 1);
    idsByRound.push(Array.from({ length: count }, () => `mt-${Math.random().toString(36).slice(2, 8)}`));
  }

  const allMatches = [];
  for (let r = 0; r < totalRounds; r++) {
    const matchIds = idsByRound[r];
    matchIds.forEach((id, i) => {
      const nextId = r < totalRounds - 1 ? idsByRound[r + 1][Math.floor(i / 2)] : null;
      const nextSlot = i % 2 === 0 ? 'team1' : 'team2';
      const team1 = r === 0 ? padded[i * 2] : null;
      const team2 = r === 0 ? padded[i * 2 + 1] : null;
      allMatches.push({
        id, tournamentId, round: roundLabel(totalRounds - 1 - r), courtId,
        scheduledDate: startDate, scheduledTime: '09:00', team1, team2,
        status: 'SCHEDULED', nextMatchId: nextId, nextSlot,
      });
    });
  }

  store.setMatches(tournamentId, allMatches.map(({ id, tournamentId: _t, ...rest }) => ({ ...rest, id })));
  // auto-advance byes
  allMatches.filter((m) => (m.team1 && !m.team2) || (!m.team1 && m.team2)).forEach((m) => advanceWinner(m.id, m.team1 || m.team2));
  return store.matchesFor(tournamentId);
}

function advanceWinner(matchId, winnerTeam) {
  const store = useStore.getState();
  const match = store.matches.find((m) => m.id === matchId);
  if (!match) return;
  store.updateMatch(matchId, { status: 'WALKOVER' });
  if (match.nextMatchId) {
    store.updateMatch(match.nextMatchId, { [match.nextSlot]: winnerTeam });
  }
}

export function generateFixtures(tournamentId, adminId, { courtId } = {}) {
  const store = useStore.getState();
  const tournament = store.getTournament(tournamentId);
  if (!tournament) return { ok: false, error: 'Tournament not found.' };
  const teams = seededTeamsFor(tournamentId);
  if (teams.length < (store.settings?.tournament?.minParticipants ?? 4)) {
    return { ok: false, error: `At least ${store.settings?.tournament?.minParticipants ?? 4} confirmed participants are required to generate fixtures.` };
  }
  const court = courtId || store.courtsForClub(tournament.venueClubId)[0]?.id;

  if (tournament.status === 'REGISTRATION_OPEN') store.transitionTournament(tournamentId, 'REGISTRATION_CLOSED');

  buildKnockout(tournamentId, teams, court, tournament.startDate);
  store.logAudit(adminId, 'FIXTURES_GENERATED', 'Tournaments', tournamentId, null, `${teams.length} teams`);
  notify(tournament.organizerId, 'Fixtures Ready', `Bracket generated for ${tournament.name}.`, 'TOURNAMENT_FIXTURE', 'TOURNAMENT', tournamentId);
  teams.forEach((t) => t.playerIds.forEach((uid) => notify(uid, 'Fixtures Ready', `Your bracket position for ${tournament.name} is set. Check the fixtures tab.`, 'TOURNAMENT_FIXTURE', 'TOURNAMENT', tournamentId)));
  return { ok: true };
}

export function startTournament(tournamentId, adminId) {
  const store = useStore.getState();
  const t = store.getTournament(tournamentId);
  if (!t) return { ok: false, error: 'Tournament not found.' };
  const target = t.status === 'REGISTRATION_CLOSED' ? 'UPCOMING' : t.status;
  if (target === 'UPCOMING') store.transitionTournament(tournamentId, 'UPCOMING');
  store.transitionTournament(tournamentId, 'LIVE');
  store.logAudit(adminId, 'TOURNAMENT_STARTED', 'Tournaments', tournamentId, null, 'LIVE');
  return { ok: true };
}

export function enterMatchResult(matchId, { winnerSide, score }, enteredBy) {
  const store = useStore.getState();
  const match = store.matches.find((m) => m.id === matchId);
  if (!match) return { ok: false, error: 'Match not found.' };
  if (!match.team1 || !match.team2) return { ok: false, error: 'Both teams must be set before entering a result.' };
  if (store.resultForMatch(matchId)) return { ok: false, error: 'Result already recorded for this match.' };

  const winner = winnerSide === 1 ? match.team1 : match.team2;
  const loser = winnerSide === 1 ? match.team2 : match.team1;

  if (match.status !== 'IN_PROGRESS') store.transitionMatch(matchId, 'IN_PROGRESS');
  store.transitionMatch(matchId, 'COMPLETED');
  store.recordMatchResult({ matchId, winnerRegId: winner.regId, loserRegId: loser.regId, score });
  store.logAudit(enteredBy, 'MATCH_RESULT_ENTERED', 'Tournaments', matchId, null, `${winner.name} def. ${loser.name} (${score})`);

  const sets = (score || '').split(',').map((s) => s.trim());
  const totalFor = sets.reduce((sum, s) => sum + (parseInt(s.split('-')[0], 10) || 0), 0);
  const totalAgainst = sets.reduce((sum, s) => sum + (parseInt(s.split('-')[1], 10) || 0), 0);

  winner.playerIds.forEach((w) => loser.playerIds.forEach((l) => {
    applyMatchOutcome({
      winnerId: w, loserId: l,
      winnerPoints: Math.round(totalFor / winner.playerIds.length),
      loserPoints: Math.round(totalAgainst / loser.playerIds.length),
      isDoubles: winner.playerIds.length > 1, isTournament: true, contextLabel: `a tournament match (${match.round})`,
    });
  }));

  if (match.nextMatchId) {
    store.updateMatch(match.nextMatchId, { [match.nextSlot]: winner });
  } else {
    // Final — tournament complete, crown the champion.
    const tournament = store.getTournament(match.tournamentId);
    store.transitionTournament(match.tournamentId, 'COMPLETED');
    winner.playerIds.forEach((uid) => applyTournamentWinToChampion(uid, tournament.name));
    loser.playerIds.forEach((uid) => store.updatePerformance(uid, { finals: (store.getPerformance(uid)?.finals || 0) + 1 }));
  }

  return { ok: true };
}

export function cancelTournament(tournamentId, adminId, reason) {
  const store = useStore.getState();
  const tournament = store.getTournament(tournamentId);
  if (!tournament) return { ok: false, error: 'Tournament not found.' };

  store.transitionTournament(tournamentId, 'CANCELLED');
  store.registrationsFor(tournamentId).filter((r) => r.status !== 'CANCELLED').forEach((r) => {
    store.updateRegistration(r.id, { status: 'CANCELLED' });
    if (r.paymentStatus === 'SUCCESS' && r.paymentId) store.refundPayment(r.paymentId, tournament.entryFee);
    notify(r.userId, 'Tournament Cancelled', `${tournament.name} was cancelled. ${r.paymentStatus === 'SUCCESS' ? 'A full refund has been issued.' : ''}`, 'TOURNAMENT_CANCELLED', 'TOURNAMENT', tournamentId);
  });
  store.logAudit(adminId, 'TOURNAMENT_CANCELLED', 'Tournaments', tournamentId, tournament.status, 'CANCELLED', reason);
  return { ok: true };
}

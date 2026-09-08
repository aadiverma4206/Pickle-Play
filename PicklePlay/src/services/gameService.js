import { useStore } from '../store';
import { notify } from './notificationService';
import { applyMatchOutcome } from './ratingService';
import { progressChallenges } from './communityService';

const SKILL_ORDER = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

function skillEligible(playerLevel, gameLevel) {
  if (!gameLevel || gameLevel === 'Open Play' || gameLevel === 'Any') return true;
  const pi = SKILL_ORDER.indexOf(playerLevel);
  const gi = SKILL_ORDER.indexOf(gameLevel);
  if (pi === -1 || gi === -1) return true;
  return Math.abs(pi - gi) <= 1; // allow one level of headroom either side
}

export function createGame(organizerId, data) {
  const store = useStore.getState();
  const organizer = store.getUser(organizerId);
  if (!organizer || organizer.status !== 'ACTIVE') return { ok: false, error: 'You cannot create a game right now.' };

  let sanitizedEntryFee = Number(data.entryFee) || 0;
  if (sanitizedEntryFee > 0) {
    if (sanitizedEntryFee < 200) sanitizedEntryFee = 200;
    if (sanitizedEntryFee > 200000) sanitizedEntryFee = 200000;
  }

  const isPlayerCreator = organizer.role === 'PLAYER';
  const game = store.createGameRecord({
    ...data,
    entryFee: sanitizedEntryFee,
    organizerId,
    createdByPlayer: isPlayerCreator,
    creatorRole: organizer.role,
  });

  store.transitionGame(game.id, 'PUBLISHED');
  store.transitionGame(game.id, 'OPEN_FOR_JOINING');
  store.addGamePlayer(game.id, organizerId, 'CONFIRMED', { paymentStatus: sanitizedEntryFee > 0 ? 'SUCCESS' : 'N/A' });
  notify(organizerId, 'Game Published', `"${game.name}" is live and open for players to join.`, 'GAME_PUBLISHED', 'GAME', game.id);

  store.logAudit(
    organizerId,
    'GAME_CREATED',
    'Games',
    game.id,
    null,
    'OPEN_FOR_JOINING',
    `Created "${game.name}" (Role: ${organizer.role}, Fee: ₹${sanitizedEntryFee})`
  );

  return { ok: true, game: store.getGame(game.id) };
}

export function joinGame(gameId, userId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  const user = store.getUser(userId);

  if (!user) return { ok: false, error: 'Please log in to join a game.' };
  if (user.status !== 'ACTIVE') return { ok: false, error: 'Your account is restricted from joining games.' };
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!['PUBLISHED', 'OPEN_FOR_JOINING', 'FULL'].includes(game.status)) return { ok: false, error: `This game is ${game.status.replace('_', ' ').toLowerCase()} and no longer accepting players.` };
  if (new Date(`${game.date}T${game.startTime}`) < new Date()) return { ok: false, error: 'This game has already started.' };
  if (store.isUserInGame(gameId, userId)) return { ok: false, error: 'You have already joined this game.' };
  if (!skillEligible(user.skillLevel, game.skillLevel)) return { ok: false, error: `This game is set for ${game.skillLevel} players.` };

  const club = store.getClub(game.clubId);
  if (club && club.status !== 'ACTIVE') return { ok: false, error: 'This club is currently unavailable.' };

  const hasSlot = game.currentPlayers < game.maxPlayers;

  if (!hasSlot) {
    const waitlistEnabled = store.settings?.games?.waitlistEnabled ?? true;
    if (!waitlistEnabled) return { ok: false, error: 'This game is full.' };
    const position = store.waitlistForGame(gameId).length + 1;
    store.addGamePlayer(gameId, userId, 'WAITLISTED', { waitlistPosition: position });
    notify(userId, 'Added to Waitlist', `"${game.name}" is full — you're #${position} on the waitlist.`, 'GAME_WAITLISTED', 'GAME', gameId);
    store.logAudit(userId, 'GAME_WAITLIST_JOINED', 'Games', gameId, null, `POS_${position}`, `${user.name} waitlisted #${position}`);
    return { ok: true, status: 'WAITLISTED', position };
  }

  let paymentStatus = 'N/A';
  if (game.entryFee > 0) {
    const payment = store.createPayment({ userId, referenceType: 'GAME', referenceId: gameId, amount: game.entryFee });
    const outcome = store.processPayment(payment.id, 'SUCCESS'); // prototype: join-time payments default to success
    paymentStatus = outcome;
    if (outcome === 'FAILED') {
      notify(userId, 'Payment Failed', `Your payment for "${game.name}" failed. Please try again.`, 'PAYMENT_FAILURE', 'GAME', gameId);
      return { ok: false, error: 'Payment failed. Please try again.' };
    }
  }

  store.addGamePlayer(gameId, userId, 'CONFIRMED', { paymentStatus });
  const updated = store.getGame(gameId);
  if (updated.currentPlayers >= updated.maxPlayers) store.transitionGame(gameId, 'FULL');

  notify(userId, 'Game Joined', `You're confirmed for "${game.name}" on ${game.date} at ${game.startTime}.`, 'GAME_JOINED', 'GAME', gameId);
  if (game.entryFee > 0) notify(userId, 'Payment Successful', `₹${game.entryFee} paid for "${game.name}".`, 'PAYMENT_SUCCESS', 'GAME', gameId);
  notify(game.organizerId, 'New Player Joined', `${user.name} joined your game "${game.name}".`, 'GAME_JOINED', 'GAME', gameId);

  store.logAudit(userId, 'GAME_JOINED', 'Games', gameId, null, 'CONFIRMED', `${user.name} (${user.role}) confirmed`);

  return { ok: true, status: 'CONFIRMED' };
}

export function leaveGame(gameId, userId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };

  // Data Security Rule: Match start locks refund and slot cancellations
  const isMatchStarted = game.status === 'IN_PROGRESS' || game.status === 'COMPLETED';
  const isMatchPast = new Date(`${game.date}T${game.startTime}`) <= new Date();
  if (isMatchStarted || isMatchPast) {
    return { ok: false, error: 'Match has already started. Refunds and cancellations are strictly disabled after match start.' };
  }

  const gp = store.gamePlayers.find((p) => p.gameId === gameId && p.userId === userId && ['CONFIRMED', 'WAITLISTED'].includes(p.status));
  if (!gp) return { ok: false, error: 'You are not part of this game.' };
  if (userId === game.organizerId) return { ok: false, error: 'Organizers should cancel the game instead of leaving it.' };

  const wasConfirmed = gp.status === 'CONFIRMED';
  store.removeGamePlayerRecord(gameId, userId);

  if (gp.paymentStatus === 'SUCCESS' && game.entryFee > 0) {
    const payment = store.payments.find((p) => p.referenceType === 'GAME' && p.referenceId === gameId && p.userId === userId);
    if (payment) store.refundPayment(payment.id, payment.amount);
    notify(userId, 'Refund Processed', `₹${game.entryFee} refunded after leaving "${game.name}".`, 'REFUND_STATUS', 'GAME', gameId);
  }
  notify(userId, 'Left Game', `You left "${game.name}".`, 'GAME_CANCELLED', 'GAME', gameId);

  store.logAudit(userId, 'GAME_LEFT', 'Games', gameId, gp.status, 'CANCELLED', `User left before match start (Refund: ${gp.paymentStatus === 'SUCCESS'})`);

  if (wasConfirmed) {
    if (game.status === 'FULL') store.transitionGame(gameId, 'OPEN_FOR_JOINING');
    promoteFromWaitlist(gameId);
  } else {
    // re-sequence remaining waitlist positions
    const remaining = store.waitlistForGame(gameId);
    remaining.forEach((p, idx) => store.updateGamePlayer(p.id, { waitlistPosition: idx + 1 }));
  }
  return { ok: true };
}

export function startGame(gameId, actingUserId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  const actingUser = store.getUser(actingUserId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!actingUser) return { ok: false, error: 'User not authenticated.' };

  if (game.status === 'IN_PROGRESS') return { ok: false, error: 'Match is already in progress.' };
  if (['COMPLETED', 'CANCELLED'].includes(game.status)) return { ok: false, error: `Match is already ${game.status.toLowerCase()}.` };

  const isOrganizer = game.organizerId === actingUserId;
  const isManagerOrAdmin = ['SUPER_ADMIN', 'OPS_ADMIN', 'CLUB_MANAGER'].includes(actingUser.role);

  // Security rule: Player creator cannot start until all slots are full
  if (actingUser.role === 'PLAYER') {
    if (!isOrganizer) return { ok: false, error: 'Only the match organizer or club managers can start this match.' };
    if (game.currentPlayers < game.maxPlayers) {
      return {
        ok: false,
        error: `All player slots must be filled to start match (${game.currentPlayers}/${game.maxPlayers} joined). Only Club Managers/Admins can force-start with open slots.`,
      };
    }
  } else if (!isOrganizer && !isManagerOrAdmin) {
    return { ok: false, error: 'You do not have permission to start this match.' };
  }

  const res = store.transitionGame(gameId, 'IN_PROGRESS');
  if (!res.ok) return res;

  store.logAudit(actingUserId, 'MATCH_STARTED', 'Games', gameId, game.status, 'IN_PROGRESS', `Match started by ${actingUser.name} (${actingUser.role})`);

  const participants = store.playersForGame(gameId);
  participants.forEach((p) => {
    notify(p.userId, 'Match Started!', `"${game.name}" is now in progress! Good luck.`, 'GAME_PUBLISHED', 'GAME', gameId);
  });

  return { ok: true };
}

export function promoteFromWaitlist(gameId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  const [next] = store.waitlistForGame(gameId);
  if (!game || !next) return { ok: false, error: 'No one on the waitlist.' };

  if (game.entryFee > 0) {
    const payment = store.createPayment({ userId: next.userId, referenceType: 'GAME', referenceId: gameId, amount: game.entryFee });
    const outcome = store.processPayment(payment.id, 'SUCCESS');
    if (outcome === 'FAILED') {
      store.updateGamePlayer(next.id, { status: 'CANCELLED' });
      notify(next.userId, 'Waitlist Slot Released', `Payment failed — your promoted slot for "${game.name}" was released.`, 'PAYMENT_FAILURE', 'GAME', gameId);
      return promoteFromWaitlist(gameId); // cascade to the next person
    }
    store.updateGamePlayer(next.id, { status: 'CONFIRMED', waitlistPosition: null, paymentStatus: outcome });
  } else {
    store.updateGamePlayer(next.id, { status: 'CONFIRMED', waitlistPosition: null, paymentStatus: 'N/A' });
  }

  const remaining = store.waitlistForGame(gameId);
  remaining.forEach((p, idx) => store.updateGamePlayer(p.id, { waitlistPosition: idx + 1 }));

  notify(next.userId, 'Waitlist Promoted', `A slot opened up in "${game.name}" — you're confirmed!`, 'WAITLIST_PROMOTION', 'GAME', gameId);
  return { ok: true, promotedUserId: next.userId };
}

export function cancelGame(gameId, actingUserId, isAdmin = false) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!isAdmin && game.organizerId !== actingUserId) return { ok: false, error: 'Only the organizer can cancel this game.' };
  if (['COMPLETED', 'CANCELLED'].includes(game.status)) return { ok: false, error: `Game is already ${game.status.toLowerCase()}.` };

  const participants = store.gamePlayers.filter((p) => p.gameId === gameId && ['CONFIRMED', 'WAITLISTED'].includes(p.status));
  store.transitionGame(gameId, 'CANCELLED');

  participants.forEach((p) => {
    store.updateGamePlayer(p.id, { status: 'CANCELLED' });
    if (p.paymentStatus === 'SUCCESS' && game.entryFee > 0) {
      const payment = store.payments.find((pay) => pay.referenceType === 'GAME' && pay.referenceId === gameId && pay.userId === p.userId);
      if (payment) store.refundPayment(payment.id, payment.amount);
      notify(p.userId, 'Refund Processed', `₹${game.entryFee} refunded — "${game.name}" was cancelled.`, 'REFUND_STATUS', 'GAME', gameId);
    }
    notify(p.userId, 'Game Cancelled', `"${game.name}" scheduled for ${game.date} has been cancelled.`, 'GAME_CANCELLED', 'GAME', gameId);
  });

  store.logAudit(actingUserId, 'GAME_CANCELLED', 'Games', gameId, game.status, 'CANCELLED', isAdmin ? 'Cancelled by Administrator' : 'Cancelled by Organizer');
  return { ok: true };
}

/** Organizer-facing edit with RBAC price protection and fee bounds */
export function updateGameDetails(gameId, patch, actingUserId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  const actingUser = store.getUser(actingUserId);
  if (!game) return { ok: false, error: 'Game not found.' };

  const isOrganizer = game.organizerId === actingUserId;
  const isManagerOrAdmin = actingUser && ['SUPER_ADMIN', 'OPS_ADMIN', 'CLUB_MANAGER'].includes(actingUser.role);

  if (!isOrganizer && !isManagerOrAdmin) {
    return { ok: false, error: 'Only the organizer or designated administrators can edit this game.' };
  }

  if (['CANCELLED', 'COMPLETED'].includes(game.status)) return { ok: false, error: `Cannot edit a game that is ${game.status.toLowerCase()}.` };

  // Data Security Rule: Admin & Manager CANNOT alter price if game was created by a player
  const isOriginallyCreatedByPlayer = game.createdByPlayer === true || game.creatorRole === 'PLAYER';
  if (isOriginallyCreatedByPlayer && !isOrganizer && isManagerOrAdmin && patch.entryFee !== undefined) {
    if (Number(patch.entryFee) !== Number(game.entryFee)) {
      return { ok: false, error: 'Admins and Managers cannot alter the price of a player-created match.' };
    }
  }

  // Price bounds enforcement: ₹200 to ₹200,000
  let sanitizedPatch = { ...patch };
  if (sanitizedPatch.entryFee !== undefined) {
    let fee = Number(sanitizedPatch.entryFee) || 0;
    if (fee > 0) {
      if (fee < 200) fee = 200;
      if (fee > 200000) fee = 200000;
    }
    sanitizedPatch.entryFee = fee;
  }

  if (sanitizedPatch.maxPlayers !== undefined && sanitizedPatch.maxPlayers < game.currentPlayers) {
    return { ok: false, error: `Maximum players cannot be less than the ${game.currentPlayers} player(s) already confirmed.` };
  }
  const startTime = sanitizedPatch.startTime || game.startTime;
  const endTime = sanitizedPatch.endTime || game.endTime;
  if (startTime >= endTime) return { ok: false, error: 'End time must be after start time.' };

  const rescheduled = (sanitizedPatch.date && sanitizedPatch.date !== game.date) || (sanitizedPatch.startTime && sanitizedPatch.startTime !== game.startTime) || (sanitizedPatch.endTime && sanitizedPatch.endTime !== game.endTime);
  store.updateGame(gameId, sanitizedPatch);

  store.logAudit(
    actingUserId,
    'GAME_UPDATED',
    'Games',
    gameId,
    null,
    JSON.stringify(sanitizedPatch),
    `Updated by ${actingUser?.name || 'User'} (${actingUser?.role || 'PLAYER'})`
  );

  if (rescheduled) {
    const participants = [...store.playersForGame(gameId), ...store.waitlistForGame(gameId)].filter((p) => p.userId !== actingUserId);
    const updated = store.getGame(gameId);
    participants.forEach((p) => notify(p.userId, 'Game Rescheduled', `"${updated.name}" was updated to ${updated.date} at ${updated.startTime}–${updated.endTime}. Check the new details.`, 'GAME_PUBLISHED', 'GAME', gameId));
  }
  return { ok: true };
}

/** Walks the game through whatever intermediate states the state machine
 *  requires to legally reach COMPLETED (Spec Section 57 — every transition
 *  must be validated, none skipped, even when a scorer enters a result
 *  after the fact). */
function advanceGameToCompleted(gameId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  if (game.status === 'COMPLETED') return;
  if (game.status !== 'IN_PROGRESS') store.transitionGame(gameId, 'IN_PROGRESS');
  store.transitionGame(gameId, 'COMPLETED');
}

export function enterGameResult(gameId, { winnerIds, loserIds, score }, enteredBy) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (store.resultForGame(gameId)) return { ok: false, error: 'A result has already been recorded for this game.' };
  if (['CANCELLED', 'DRAFT'].includes(game.status)) return { ok: false, error: 'Cannot record a result for this game.' };

  store.recordGameResult({ gameId, winnerIds, loserIds, score, createdBy: enteredBy });
  advanceGameToCompleted(gameId);

  const sets = (score || '').split(',').map((s) => s.trim());
  const totalFor = sets.reduce((sum, s) => sum + (parseInt(s.split('-')[0], 10) || 0), 0);
  const totalAgainst = sets.reduce((sum, s) => sum + (parseInt(s.split('-')[1], 10) || 0), 0);
  const isDoubles = winnerIds.length > 1;

  winnerIds.forEach((w) => loserIds.forEach((l) => {
    applyMatchOutcome({
      winnerId: w, loserId: l,
      winnerPoints: Math.round(totalFor / winnerIds.length),
      loserPoints: Math.round(totalAgainst / loserIds.length),
      isDoubles, isTournament: false, contextLabel: `"${game.name}"`,
    });
  }));

  [...winnerIds, ...loserIds].forEach((uid) => progressChallenges(uid, 'GAMES_PLAYED', 1));
  winnerIds.forEach((uid) => progressChallenges(uid, 'GAMES_WON', 1));

  return { ok: true };
}

/** Permanently deletes a game record (as opposed to cancelGame, which is a
 *  reversible-in-spirit status transition that keeps the row for history).
 *  Refunds every player who paid first, then removes the game, its
 *  participation rows and any result. The audit log entry survives
 *  independently, so the deletion itself is still traceable even though the
 *  game row is gone. Callers are responsible for restricting this to Super
 *  Admin — see GameManageDrawer. */
export function deleteGame(gameId, adminId) {
  const store = useStore.getState();
  const game = store.getGame(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };

  const participants = store.gamePlayers.filter((p) => p.gameId === gameId && ['CONFIRMED', 'WAITLISTED'].includes(p.status));
  participants.forEach((p) => {
    if (p.paymentStatus === 'SUCCESS' && game.entryFee > 0) {
      const payment = store.payments.find((pay) => pay.referenceType === 'GAME' && pay.referenceId === gameId && pay.userId === p.userId);
      if (payment) store.refundPayment(payment.id, payment.amount);
      notify(p.userId, 'Refund Processed', `₹${game.entryFee} refunded — "${game.name}" was removed by an administrator.`, 'REFUND_STATUS', 'GAME', gameId);
    }
    notify(p.userId, 'Game Removed', `"${game.name}" scheduled for ${game.date} has been removed by an administrator.`, 'GAME_CANCELLED', 'GAME', gameId);
  });

  store.logAudit(adminId, 'GAME_DELETED', 'Games', gameId, game.status, 'DELETED', game.name);
  store.deleteGameRecord(gameId);
  return { ok: true };
}

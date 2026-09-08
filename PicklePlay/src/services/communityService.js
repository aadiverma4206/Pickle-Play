import { useStore } from '../store';
import { notify } from './notificationService';

export function joinCommunity(communityId, userId) {
  const store = useStore.getState();
  const community = store.getCommunity(communityId);
  if (!community) return { ok: false, error: 'Community not found.' };
  const existing = store.membershipOf(communityId, userId);
  if (existing && ['ACTIVE', 'PENDING'].includes(existing.status)) {
    return { ok: false, error: existing.status === 'PENDING' ? 'Your request is pending approval.' : 'You are already a member.' };
  }
  if (community.maxMembers && store.membersOf(communityId).length >= community.maxMembers) {
    return { ok: false, error: 'This community has reached its maximum members.' };
  }

  if (community.isPrivate) {
    store.addMemberRecord(communityId, userId, 'MEMBER', 'PENDING');
    notify(community.ownerId, 'Membership Request', `A player requested to join "${community.name}".`, 'COMMUNITY_REQUEST', 'COMMUNITY', communityId);
    return { ok: true, status: 'PENDING' };
  }

  store.addMemberRecord(communityId, userId, 'MEMBER', 'ACTIVE');
  notify(userId, 'Community Joined', `Welcome to "${community.name}"!`, 'COMMUNITY_INVITATION', 'COMMUNITY', communityId);
  return { ok: true, status: 'ACTIVE' };
}

export function approveMembership(memberId, approve, adminId) {
  const store = useStore.getState();
  const member = store.communityMembers.find((m) => m.id === memberId);
  if (!member) return { ok: false, error: 'Request not found.' };
  const community = store.getCommunity(member.communityId);
  store.updateMembership(memberId, { status: approve ? 'ACTIVE' : 'REMOVED' });
  notify(member.userId, approve ? 'Membership Approved' : 'Membership Declined', approve ? `You're now a member of "${community.name}".` : `Your request to join "${community.name}" was declined.`, 'COMMUNITY_APPROVAL', 'COMMUNITY', community.id);
  if (adminId) store.logAudit(adminId, 'MEMBERSHIP_REVIEWED', 'Community', memberId, 'PENDING', approve ? 'ACTIVE' : 'REMOVED');
  return { ok: true };
}

export function banMember(memberId, adminId, reason) {
  const store = useStore.getState();
  const member = store.communityMembers.find((m) => m.id === memberId);
  if (!member) return { ok: false, error: 'Member not found.' };
  store.updateMembership(memberId, { status: 'BANNED' });
  const community = store.getCommunity(member.communityId);
  notify(member.userId, 'Removed from Community', `You were removed from "${community.name}".`, 'COMMUNITY_APPROVAL', 'COMMUNITY', community.id);
  store.logAudit(adminId, 'MEMBER_BANNED', 'Community', memberId, 'ACTIVE', 'BANNED', reason);
  return { ok: true };
}

export function createPost(communityId, userId, { type, content, mediaUrl }) {
  const store = useStore.getState();
  const membership = store.membershipOf(communityId, userId);
  if (!membership || membership.status !== 'ACTIVE') return { ok: false, error: 'Join this community to post.' };
  const post = store.createPostRecord({ communityId, userId, type, content, mediaUrl: mediaUrl || null });
  return { ok: true, post };
}

export function registerForEvent(eventId, userId) {
  const store = useStore.getState();
  const event = store.getEvent(eventId);
  if (!event) return { ok: false, error: 'Event not found.' };
  if (!['PUBLISHED', 'REGISTRATION_OPEN'].includes(event.status)) return { ok: false, error: 'Registration is not open for this event.' };
  if (store.isRegisteredForEvent(eventId, userId)) return { ok: false, error: 'You have already registered for this event.' };
  if (store.participantsFor(eventId).length >= event.maxParticipants) return { ok: false, error: 'This event is full.' };

  if (event.entryFee > 0) {
    const payment = store.createPayment({ userId, referenceType: 'EVENT', referenceId: eventId, amount: event.entryFee });
    const outcome = store.processPayment(payment.id, 'SUCCESS');
    if (outcome === 'FAILED') return { ok: false, error: 'Payment failed. Please try again.' };
  }

  store.addEventParticipant(eventId, userId);
  if (store.participantsFor(eventId).length >= event.maxParticipants) store.updateEvent(eventId, { status: 'FULL' });
  notify(userId, 'Event Registration', `You're registered for "${event.name}" on ${event.date}.`, 'TOURNAMENT_REGISTRATION', 'EVENT', eventId);
  return { ok: true };
}

/** Called after relevant actions elsewhere in the app (a game completing, a
 *  tournament joined, a rating change) to progress any active challenges —
 *  keeps the "Community Journey" loop connected per Spec Section 25/59. */
export function progressChallenges(userId, targetType, incrementBy = 1) {
  const store = useStore.getState();
  const applicable = store.challenges.filter((c) => c.targetType === targetType && c.status === 'ACTIVE');
  applicable.forEach((c) => {
    const completedNow = store.bumpChallengeProgress(c.id, userId, incrementBy);
    if (completedNow) {
      notify(userId, 'Challenge Complete', `You completed "${c.title}"! Reward: ${c.reward}.`, 'CHALLENGE_COMPLETE', 'CHALLENGE', c.id);
    }
  });
}

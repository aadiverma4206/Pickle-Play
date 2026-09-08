import { genCommunityId, genPostId, genCommentId, genEventId, genChallengeId } from '../../lib/id';

export const createCommunitySlice = (set, get) => ({
  communities: [],
  communityMembers: [],
  posts: [],
  postLikes: [],
  comments: [],
  communityEvents: [],
  eventParticipants: [],
  challenges: [],
  challengeProgress: [],

  // ---- communities & membership ----
  getCommunity: (id) => get().communities.find((c) => c.id === id) || null,
  membersOf: (communityId) => get().communityMembers.filter((m) => m.communityId === communityId && m.status === 'ACTIVE'),
  pendingRequestsFor: (communityId) => get().communityMembers.filter((m) => m.communityId === communityId && m.status === 'PENDING'),
  membershipOf: (communityId, userId) => get().communityMembers.find((m) => m.communityId === communityId && m.userId === userId) || null,
  communitiesForUser: (userId) => {
    const ids = get().communityMembers.filter((m) => m.userId === userId && m.status === 'ACTIVE').map((m) => m.communityId);
    return get().communities.filter((c) => ids.includes(c.id));
  },

  createCommunityRecord: (data) => {
    const community = { id: genCommunityId(), status: 'ACTIVE', createdAt: new Date().toISOString(), ...data };
    set((state) => {
      state.communities.push(community);
      state.communityMembers.push({ id: `cmem-${Date.now()}`, communityId: community.id, userId: data.ownerId, role: 'OWNER', status: 'ACTIVE', joinedAt: new Date().toISOString() });
    });
    return community;
  },

  updateCommunity: (id, patch) => {
    set((state) => {
      const c = state.communities.find((x) => x.id === id);
      if (c) Object.assign(c, patch);
    });
  },

  addMemberRecord: (communityId, userId, role, status) => {
    const member = { id: `cmem-${Date.now()}-${userId}`, communityId, userId, role, status, joinedAt: new Date().toISOString() };
    set((state) => { state.communityMembers.push(member); });
    return member;
  },

  updateMembership: (memberId, patch) => {
    set((state) => {
      const m = state.communityMembers.find((x) => x.id === memberId);
      if (m) Object.assign(m, patch);
    });
  },

  removeMember: (memberId) => {
    set((state) => {
      const m = state.communityMembers.find((x) => x.id === memberId);
      if (m) m.status = 'REMOVED';
    });
  },

  // ---- posts / likes / comments ----
  postsFor: (communityId) => get().posts.filter((p) => p.communityId === communityId && p.status === 'ACTIVE').sort((a, b) => (b.pinned - a.pinned) || (new Date(b.createdAt) - new Date(a.createdAt))),
  likesFor: (postId) => get().postLikes.filter((l) => l.postId === postId),
  hasLiked: (postId, userId) => get().postLikes.some((l) => l.postId === postId && l.userId === userId),
  commentsFor: (postId) => get().comments.filter((c) => c.postId === postId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),

  createPostRecord: (data) => {
    const post = { id: genPostId(), status: 'ACTIVE', pinned: false, createdAt: new Date().toISOString(), ...data };
    set((state) => { state.posts.push(post); });
    return post;
  },

  togglePostLike: (postId, userId) => {
    const existing = get().postLikes.find((l) => l.postId === postId && l.userId === userId);
    set((state) => {
      if (existing) {
        state.postLikes = state.postLikes.filter((l) => l.id !== existing.id);
      } else {
        state.postLikes.push({ id: `lk-${Date.now()}`, postId, userId, createdAt: new Date().toISOString() });
      }
    });
    return !existing;
  },

  addComment: (postId, userId, content) => {
    const comment = { id: genCommentId(), postId, userId, content, createdAt: new Date().toISOString() };
    set((state) => { state.comments.push(comment); });
    return comment;
  },

  setPostStatus: (postId, status, adminId) => {
    set((state) => {
      const p = state.posts.find((x) => x.id === postId);
      if (p) p.status = status;
    });
    if (adminId) get().logAudit(adminId, 'POST_MODERATED', 'Community', postId, null, status);
  },

  setPostPinned: (postId, pinned) => {
    set((state) => {
      const p = state.posts.find((x) => x.id === postId);
      if (p) p.pinned = pinned;
    });
  },

  // ---- events ----
  eventsFor: (communityId) => get().communityEvents.filter((e) => e.communityId === communityId).sort((a, b) => new Date(a.date) - new Date(b.date)),
  getEvent: (eventId) => get().communityEvents.find((e) => e.id === eventId) || null,
  participantsFor: (eventId) => get().eventParticipants.filter((p) => p.eventId === eventId && p.status === 'REGISTERED'),
  isRegisteredForEvent: (eventId, userId) => get().eventParticipants.some((p) => p.eventId === eventId && p.userId === userId && p.status === 'REGISTERED'),

  createEventRecord: (data) => {
    const event = { id: genEventId(), status: 'REGISTRATION_OPEN', createdAt: new Date().toISOString(), ...data };
    set((state) => { state.communityEvents.push(event); });
    return event;
  },

  updateEvent: (eventId, patch) => {
    set((state) => {
      const e = state.communityEvents.find((x) => x.id === eventId);
      if (e) Object.assign(e, patch);
    });
  },

  addEventParticipant: (eventId, userId) => {
    const p = { id: `evp-${Date.now()}`, eventId, userId, status: 'REGISTERED', registeredAt: new Date().toISOString() };
    set((state) => { state.eventParticipants.push(p); });
    return p;
  },

  // ---- challenges ----
  challengesFor: (communityId) => get().challenges.filter((c) => c.communityId === communityId || c.communityId === null),
  progressFor: (challengeId, userId) => get().challengeProgress.find((p) => p.challengeId === challengeId && p.userId === userId) || null,

  createChallengeRecord: (data) => {
    const challenge = { id: genChallengeId(), status: 'ACTIVE', ...data };
    set((state) => { state.challenges.push(challenge); });
    return challenge;
  },

  bumpChallengeProgress: (challengeId, userId, incrementBy = 1) => {
    let completedNow = false;
    set((state) => {
      const challenge = state.challenges.find((c) => c.id === challengeId);
      if (!challenge) return;
      let progress = state.challengeProgress.find((p) => p.challengeId === challengeId && p.userId === userId);
      if (!progress) {
        progress = { id: `cp-${Date.now()}-${userId}`, challengeId, userId, current: 0, status: 'IN_PROGRESS' };
        state.challengeProgress.push(progress);
      }
      if (progress.status === 'COMPLETED') return;
      progress.current = Math.min(challenge.targetValue, progress.current + incrementBy);
      if (progress.current >= challenge.targetValue) {
        progress.status = 'COMPLETED';
        progress.completedAt = new Date().toISOString();
        completedNow = true;
      }
    });
    return completedNow;
  },
});

import { genClubId, genCourtId } from '../../lib/id';
import { CLUB_STATUS, COURT_STATUS } from '../../lib/stateMachines';

export const createClubsSlice = (set, get) => ({
  clubs: [],
  courts: [],

  getClub: (clubId) => get().clubs.find((c) => c.id === clubId) || null,
  getCourt: (courtId) => get().courts.find((c) => c.id === courtId) || null,
  courtsForClub: (clubId) => get().courts.filter((c) => c.clubId === clubId),
  clubsManagedBy: (userId) => get().clubs.filter((c) => (c.managerIds || []).includes(userId)),

  createClub: (data, adminId) => {
    const club = {
      id: genClubId(), status: CLUB_STATUS.PENDING, photos: [], facilities: [], managerIds: [],
      createdAt: new Date().toISOString(), ...data,
    };
    set((state) => { state.clubs.push(club); });
    get().logAudit(adminId, 'CLUB_CREATED', 'Clubs', club.id, null, club.status);
    return club;
  },

  updateClub: (clubId, patch, adminId) => {
    set((state) => {
      const c = state.clubs.find((x) => x.id === clubId);
      if (c) Object.assign(c, patch);
    });
    if (adminId) get().logAudit(adminId, 'CLUB_UPDATED', 'Clubs', clubId, null, JSON.stringify(patch));
  },

  setClubStatus: (clubId, status, adminId) => {
    const club = get().getClub(clubId);
    if (!club) return { ok: false, error: 'Club not found.' };
    const before = club.status;
    set((state) => {
      const c = state.clubs.find((x) => x.id === clubId);
      if (c) c.status = status;
    });
    get().logAudit(adminId, 'CLUB_STATUS_CHANGED', 'Clubs', clubId, before, status);
    return { ok: true };
  },

  addCourt: (clubId, data, adminId) => {
    const court = {
      id: genCourtId(), clubId, status: COURT_STATUS.AVAILABLE,
      pricing: { base: 400, peakMultiplier: 1.5, weekendMultiplier: 1.75, peakWindows: [{ start: '17:00', end: '21:00' }] },
      createdAt: new Date().toISOString(), ...data,
    };
    set((state) => { state.courts.push(court); });
    get().logAudit(adminId, 'COURT_ADDED', 'Courts', court.id, null, clubId);
    return court;
  },

  updateCourt: (courtId, patch, adminId) => {
    set((state) => {
      const c = state.courts.find((x) => x.id === courtId);
      if (c) Object.assign(c, patch);
    });
    if (adminId) get().logAudit(adminId, 'COURT_UPDATED', 'Courts', courtId, null, JSON.stringify(patch));
  },

  setCourtStatus: (courtId, status, adminId) => {
    const court = get().getCourt(courtId);
    if (!court) return { ok: false, error: 'Court not found.' };
    const before = court.status;
    set((state) => {
      const c = state.courts.find((x) => x.id === courtId);
      if (c) c.status = status;
    });
    get().logAudit(adminId, 'COURT_STATUS_CHANGED', 'Courts', courtId, before, status);
    return { ok: true };
  },
});

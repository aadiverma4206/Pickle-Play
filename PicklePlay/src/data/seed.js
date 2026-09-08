import { addDays, format, subDays } from 'date-fns';
import { DEFAULT_REFUND_RULES } from '../lib/refundEngine';

// Anchor date for all relative dummy data — keeps the prototype feeling
// "live" regardless of when it's actually opened.
export const TODAY = new Date('2026-08-19T09:00:00');
const d = (offset) => format(offset >= 0 ? addDays(TODAY, offset) : subDays(TODAY, -offset), 'yyyy-MM-dd');
const iso = (offset, hh = 9) => {
  const base = offset >= 0 ? addDays(TODAY, offset) : subDays(TODAY, -offset);
  base.setHours(hh, 0, 0, 0);
  return base.toISOString();
};

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad'];
const FIRST_NAMES = ['Rahul', 'Amit', 'Rohit', 'Neeraj', 'Mohit', 'Raj', 'Priya', 'Sneha', 'Anita', 'Kavya', 'Vikram', 'Arjun', 'Divya', 'Pooja', 'Sanjay', 'Meera', 'Karan', 'Ishaan', 'Riya', 'Tanya', 'Aditya', 'Nisha', 'Varun', 'Simran', 'Farhan', 'Leela', 'Gopal', 'Ananya'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Nair', 'Reddy', 'Khan', 'Singh', 'Mehta', 'Kapoor', 'Joshi', 'Rao', 'Bose', 'Chawla', 'Malhotra'];

function name(i) {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
];

const CLUB_PHOTOS = [
  ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&auto=format&fit=crop&q=80'],
  ['https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'],
  ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80'],
  ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80'],
];

export function buildSeed() {
  const users = [];
  const ratings = [];
  const performance = [];

  // ---- Admin & staff users -------------------------------------------------
  users.push(u('usr-super', 'SUPER_ADMIN', 'Ananya Bose', 'super.admin@pickleplay.app', '9000000001', 'Bengaluru'));
  users.push(u('usr-ops', 'OPS_ADMIN', 'Vikram Rao', 'ops.admin@pickleplay.app', '9000000002', 'Bengaluru'));
  users.push(u('usr-finance', 'FINANCE_ADMIN', 'Meera Iyer', 'finance.admin@pickleplay.app', '9000000003', 'Mumbai'));
  users.push(u('usr-cm1', 'CLUB_MANAGER', 'Sanjay Gupta', 'sanjay.manager@pickleplay.app', '9000000004', 'Bengaluru'));
  users.push(u('usr-cm2', 'CLUB_MANAGER', 'Divya Nair', 'divya.manager@pickleplay.app', '9000000005', 'Pune'));
  users.push(u('usr-comm1', 'COMMUNITY_ADMIN', 'Karan Mehta', 'karan.community@pickleplay.app', '9000000006', 'Mumbai'));
  users.push(u('usr-mod1', 'MODERATOR', 'Tanya Kapoor', 'tanya.mod@pickleplay.app', '9000000007', 'Delhi'));

  // ---- Players (this device's default logged-in user is usr-1: Rahul) -----
  const PLAYER_COUNT = 22;
  for (let i = 1; i <= PLAYER_COUNT; i++) {
    users.push(u(`usr-${i}`, 'PLAYER', name(i), `${name(i).split(' ')[0].toLowerCase()}${i}@mail.com`, `90000001${String(i).padStart(2, '0')}`, CITIES[i % CITIES.length]));
  }

  users.forEach((usr, idx) => {
    const skillBase = 900 + (idx * 37) % 900;
    ratings.push({
      userId: usr.id,
      skillRating: usr.role === 'PLAYER' ? skillBase : 1000,
      ratingHistory: [{ date: d(-60), rating: skillBase - 80 }, { date: d(-30), rating: skillBase - 30 }, { date: d(0), rating: skillBase }],
      communityRating: 4 + ((idx % 10) / 10),
      communityRatingCount: 6 + (idx % 12),
      reliabilityScore: 82 + (idx % 18),
      lastUpdated: iso(0),
    });
    const wins = 4 + (idx % 14);
    const losses = 2 + (idx % 9);
    performance.push({
      userId: usr.id,
      matchesPlayed: wins + losses,
      wins, losses,
      winRate: Math.round((wins / (wins + losses)) * 100),
      currentStreak: (idx % 5) - 2,
      longestStreak: 3 + (idx % 6),
      pointsScored: (wins + losses) * 11 + idx,
      pointsConceded: (wins + losses) * 8 + idx,
      tournamentMatches: idx % 8,
      tournamentWins: idx % 4,
      finals: idx % 3,
      titles: idx % 5 === 0 ? 1 : 0,
      matchHistory: [],
      lastUpdated: iso(0),
    });
  });

  function u(id, role, fullName, email, mobile, city) {
    const avatarUrl = AVATARS[Math.abs(hash(id)) % AVATARS.length];
    return {
      id, role, name: fullName, email, mobile,
      password: 'Password@123',
      profileImage: avatarUrl,
      gender: ['Male', 'Female'][id.length % 2],
      dob: '1996-05-14',
      city, area: 'Central',
      skillLevel: ['Beginner', 'Intermediate', 'Advanced', 'Professional'][Math.abs(hash(id)) % 4],
      playingHand: Math.abs(hash(id)) % 2 === 0 ? 'Right' : 'Left',
      bio: role === 'PLAYER' ? 'Weekend pickleball enthusiast. Always up for a game!' : '',
      status: 'ACTIVE',
      createdAt: iso(-120),
    };
  }

  // ---- Clubs & Courts -------------------------------------------------------
  const clubs = [
    club('clb-1', 'Smash Point Pickleball Club', 'Bengaluru', ['usr-cm1'], 'ACTIVE', 0),
    club('clb-2', 'Baseline Sports Arena', 'Bengaluru', ['usr-cm1'], 'ACTIVE', 1),
    club('clb-3', 'Dink & Drive Courts', 'Pune', ['usr-cm2'], 'ACTIVE', 2),
    club('clb-4', 'Kitchen Line Pickleball Hub', 'Mumbai', [], 'PENDING', 3),
  ];
  function club(id, clubName, city, managerIds, status, photoIdx = 0) {
    return {
      id, name: clubName, logo: null, photos: CLUB_PHOTOS[photoIdx % CLUB_PHOTOS.length] || [],
      address: `${clubName}, MG Road`, city,
      location: { lat: 12.97 + Math.random() * 0.1, lng: 77.59 + Math.random() * 0.1 },
      contact: '080-4000-1000',
      openingHours: '06:00 - 22:00',
      facilities: ['Parking', 'Washroom', 'Drinking Water', 'Pro Shop', 'Floodlights'],
      description: `${clubName} offers premium pickleball courts with professional coaching and open play sessions.`,
      status, managerIds,
      createdAt: iso(-200),
    };
  }

  const courts = [];
  clubs.forEach((c, ci) => {
    for (let n = 1; n <= 3; n++) {
      courts.push({
        id: `crt-${ci + 1}-${n}`,
        clubId: c.id,
        name: `Court ${n}`,
        number: n,
        indoorOutdoor: n === 1 ? 'Indoor' : 'Outdoor',
        surface: 'Acrylic',
        pricing: {
          base: 400 + ci * 50,
          peakMultiplier: 1.5,
          weekendMultiplier: 1.75,
          peakWindows: [{ start: '17:00', end: '21:00' }],
        },
        status: n === 3 && ci === 1 ? 'MAINTENANCE' : 'AVAILABLE',
        createdAt: iso(-200),
      });
    }
  });

  // ---- Court bookings & payments ---------------------------------------------
  const bookings = [];
  const payments = [];
  let payCounter = 1;
  function pay(userId, refType, refId, amount, status, offset) {
    const id = `pay-${payCounter++}`;
    payments.push({
      id, userId, referenceType: refType, referenceId: refId, amount,
      method: 'UPI', transactionId: `TXN${100000 + payCounter}`, status,
      createdAt: iso(offset),
    });
    return id;
  }

  [
    { user: 'usr-1', court: 'crt-1-1', off: 1, start: '18:00', end: '19:00', status: 'CONFIRMED' },
    { user: 'usr-2', court: 'crt-1-2', off: 2, start: '07:00', end: '08:00', status: 'CONFIRMED' },
    { user: 'usr-3', court: 'crt-2-1', off: -2, start: '19:00', end: '20:00', status: 'COMPLETED' },
    { user: 'usr-4', court: 'crt-3-1', off: -5, start: '18:00', end: '19:00', status: 'CANCELLED' },
    { user: 'usr-1', court: 'crt-2-2', off: -10, start: '20:00', end: '21:00', status: 'COMPLETED' },
    { user: 'usr-5', court: 'crt-1-1', off: 4, start: '06:00', end: '07:00', status: 'CONFIRMED' },
  ].forEach((b, idx) => {
    const court = courts.find((c) => c.id === b.court);
    const amount = court.pricing.base * (b.start >= '17:00' ? court.pricing.peakMultiplier : 1);
    const paymentStatus = b.status === 'CANCELLED' ? 'REFUNDED' : 'SUCCESS';
    const paymentId = pay(b.user, 'BOOKING', `bk-${idx + 1}`, Math.round(amount), paymentStatus, b.off - 1);
    bookings.push({
      id: `bk-${idx + 1}`, userId: b.user, clubId: court.clubId, courtId: court.id,
      date: d(b.off), startTime: b.start, endTime: b.end,
      amount: Math.round(amount), paymentId, paymentStatus,
      status: b.status, createdAt: iso(b.off - 1),
      cancelledAt: b.status === 'CANCELLED' ? iso(b.off - 3) : null,
      refund: b.status === 'CANCELLED' ? { percent: 100, amount: Math.round(amount) } : null,
    });
  });

  // ---- Games & Game players ---------------------------------------------------
  const games = [];
  const gamePlayers = [];
  const gameResults = [];
  let gpCounter = 1;
  function addPlayers(gameId, playerIds, max, waitlistIds = []) {
    playerIds.forEach((pid) => {
      gamePlayers.push({ id: `gp-${gpCounter++}`, gameId, userId: pid, status: 'CONFIRMED', joinedAt: iso(-1), waitlistPosition: null, paymentStatus: 'SUCCESS' });
    });
    waitlistIds.forEach((pid, i) => {
      gamePlayers.push({ id: `gp-${gpCounter++}`, gameId, userId: pid, status: 'WAITLISTED', joinedAt: iso(-1), waitlistPosition: i + 1, paymentStatus: 'PENDING' });
    });
  }

  const gameDefs = [
    { id: 'gm-1', club: 'clb-1', court: 'crt-1-1', organizer: 'usr-1', name: 'Evening Doubles Fun', type: 'Doubles', skill: 'Intermediate', max: 4, fee: 150, off: 0, start: '18:00', end: '19:30', status: 'OPEN_FOR_JOINING', players: ['usr-1', 'usr-2'], wait: [] },
    { id: 'gm-2', club: 'clb-1', court: 'crt-1-2', organizer: 'usr-3', name: 'Morning Open Play', type: 'Open Play', skill: 'Beginner', max: 8, fee: 100, off: 1, start: '06:30', end: '08:00', status: 'OPEN_FOR_JOINING', players: ['usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-7', 'usr-8'], wait: [] },
    { id: 'gm-3', club: 'clb-2', court: 'crt-2-1', organizer: 'usr-9', name: 'Competitive Mixed Doubles', type: 'Mixed Doubles', skill: 'Advanced', max: 4, fee: 200, off: 2, start: '19:00', end: '20:30', status: 'FULL', players: ['usr-9', 'usr-10', 'usr-11', 'usr-12'], wait: ['usr-13', 'usr-14'] },
    { id: 'gm-4', club: 'clb-3', court: 'crt-3-1', organizer: 'usr-15', name: 'Friendly Singles Ladder', type: 'Singles', skill: 'Intermediate', max: 2, fee: 0, off: 3, start: '17:00', end: '18:00', status: 'OPEN_FOR_JOINING', players: ['usr-15'], wait: [] },
    { id: 'gm-5', club: 'clb-1', court: 'crt-1-1', organizer: 'usr-2', name: 'Weekend Warriors', type: 'Doubles', skill: 'Intermediate', max: 4, fee: 150, off: 5, start: '09:00', end: '10:30', status: 'PUBLISHED', players: ['usr-2'], wait: [] },
    { id: 'gm-6', club: 'clb-2', court: 'crt-2-2', organizer: 'usr-6', name: 'Sunset Doubles', type: 'Doubles', skill: 'Beginner', max: 4, fee: 100, off: -1, start: '18:00', end: '19:30', status: 'COMPLETED', players: ['usr-6', 'usr-7', 'usr-16', 'usr-17'], wait: [] },
    { id: 'gm-7', club: 'clb-1', court: 'crt-1-2', organizer: 'usr-8', name: 'Cancelled Practice', type: 'Doubles', skill: 'Intermediate', max: 4, fee: 100, off: -3, start: '18:00', end: '19:00', status: 'CANCELLED', players: ['usr-8', 'usr-18'], wait: [] },
    { id: 'gm-8', club: 'clb-3', court: 'crt-3-2', organizer: 'usr-19', name: 'Pro Level Clash', type: 'Competitive', skill: 'Professional', max: 4, fee: 300, off: -5, start: '20:00', end: '21:30', status: 'COMPLETED', players: ['usr-19', 'usr-20', 'usr-1', 'usr-3'], wait: [] },
  ];

  gameDefs.forEach((g) => {
    games.push({
      id: g.id, clubId: g.club, courtId: g.court, organizerId: g.organizer, name: g.name,
      gameType: g.type, skillLevel: g.skill, maxPlayers: g.max, currentPlayers: g.players.length,
      entryFee: g.fee, date: d(g.off), startTime: g.start, endTime: g.end,
      status: g.status, description: `${g.type} session — all skill-appropriate players welcome.`,
      isPrivate: false, createdAt: iso(g.off - 2),
    });
    addPlayers(g.id, g.players, g.max, g.wait);
  });

  gameResults.push({
    id: 'gr-1', gameId: 'gm-6', winnerIds: ['usr-6', 'usr-7'], loserIds: ['usr-16', 'usr-17'],
    score: '11-7, 11-9', createdBy: 'usr-6', createdAt: iso(-1, 20),
  });
  gameResults.push({
    id: 'gr-2', gameId: 'gm-8', winnerIds: ['usr-19', 'usr-20'], loserIds: ['usr-1', 'usr-3'],
    score: '11-9, 9-11, 11-6', createdBy: 'usr-19', createdAt: iso(-5, 21),
  });

  // ---- Tournaments -------------------------------------------------------------
  const tournaments = [
    {
      id: 'tn-1', name: 'PicklePlay City Open 2026',
      banner: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
      organizerId: 'usr-ops', venueClubId: 'clb-1',
      startDate: d(20), endDate: d(21), registrationStart: d(-10), registrationEnd: d(15),
      entryFee: 500, minParticipants: 8, maxParticipants: 16, category: 'Doubles', skillLevel: 'Advanced',
      format: 'Knockout', prize: '₹25,000 Prize Pool', rules: 'Standard USAPA rules apply.',
      status: 'REGISTRATION_OPEN', createdAt: iso(-15),
    },
    {
      id: 'tn-2', name: 'Baseline Summer Smash',
      banner: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
      organizerId: 'usr-cm1', venueClubId: 'clb-2',
      startDate: d(-14), endDate: d(-13), registrationStart: d(-40), registrationEnd: d(-16),
      entryFee: 300, minParticipants: 4, maxParticipants: 8, category: 'Singles', skillLevel: 'Intermediate',
      format: 'Knockout', prize: '₹10,000 Prize Pool', rules: 'Standard USAPA rules apply.',
      status: 'COMPLETED', createdAt: iso(-50),
    },
  ];

  const registrations = [];
  const matches = [];
  const matchResults = [];

  // tn-1: open registrations, some teams pending, some confirmed
  [
    { user: 'usr-1', partner: 'usr-2', status: 'CONFIRMED', pay: 'SUCCESS' },
    { user: 'usr-9', partner: 'usr-10', status: 'CONFIRMED', pay: 'SUCCESS' },
    { user: 'usr-11', partner: 'usr-12', status: 'CONFIRMED', pay: 'SUCCESS' },
    { user: 'usr-13', partner: null, status: 'TEAM_PENDING', pay: 'PENDING' },
  ].forEach((r, idx) => {
    registrations.push({
      id: `reg-1-${idx + 1}`, tournamentId: 'tn-1', userId: r.user, partnerId: r.partner,
      teamName: r.partner ? `${r.user}-${r.partner}` : null,
      paymentStatus: r.pay, status: r.status, registeredAt: iso(-8 + idx),
    });
  });

  // tn-2: completed with a 4-player knockout bracket
  const tn2Players = ['usr-15', 'usr-16', 'usr-17', 'usr-18'];
  tn2Players.forEach((p, idx) => {
    registrations.push({ id: `reg-2-${idx + 1}`, tournamentId: 'tn-2', userId: p, partnerId: null, teamName: null, paymentStatus: 'SUCCESS', status: 'CONFIRMED', registeredAt: iso(-38) });
  });
  matches.push(
    { id: 'mt-1', tournamentId: 'tn-2', round: 'Semi Final', courtId: 'crt-2-1', scheduledDate: d(-14), scheduledTime: '10:00', team1: { regId: 'reg-2-1', playerIds: ['usr-15'], name: name(15) }, team2: { regId: 'reg-2-2', playerIds: ['usr-16'], name: name(16) }, status: 'COMPLETED' },
    { id: 'mt-2', tournamentId: 'tn-2', round: 'Semi Final', courtId: 'crt-2-2', scheduledDate: d(-14), scheduledTime: '11:00', team1: { regId: 'reg-2-3', playerIds: ['usr-17'], name: name(17) }, team2: { regId: 'reg-2-4', playerIds: ['usr-18'], name: name(18) }, status: 'COMPLETED' },
    { id: 'mt-3', tournamentId: 'tn-2', round: 'Final', courtId: 'crt-2-1', scheduledDate: d(-13), scheduledTime: '16:00', team1: { regId: 'reg-2-1', playerIds: ['usr-15'], name: name(15) }, team2: { regId: 'reg-2-3', playerIds: ['usr-17'], name: name(17) }, status: 'COMPLETED' },
  );
  matchResults.push(
    { id: 'rs-1', matchId: 'mt-1', winnerRegId: 'reg-2-1', loserRegId: 'reg-2-2', score: '11-4, 11-6', createdAt: iso(-14, 11) },
    { id: 'rs-2', matchId: 'mt-2', winnerRegId: 'reg-2-3', loserRegId: 'reg-2-4', score: '11-9, 8-11, 11-7', createdAt: iso(-14, 12) },
    { id: 'rs-3', matchId: 'mt-3', winnerRegId: 'reg-2-1', loserRegId: 'reg-2-3', score: '11-6, 11-8', createdAt: iso(-13, 17) },
  );

  // ---- Communities ----------------------------------------------------------------
  const communities = [
    { id: 'cm-1', name: 'Bengaluru Pickleball Club', coverImage: null, description: 'The largest pickleball community in Bengaluru — daily games, events and challenges.', location: 'Bengaluru', skillLevel: 'All Levels', isPrivate: false, maxMembers: 500, ownerId: 'usr-comm1', rules: 'Be respectful. No spamming.', status: 'ACTIVE', createdAt: iso(-180) },
    { id: 'cm-2', name: 'Mumbai Dinkers', coverImage: null, description: 'Mumbai based casual and competitive players.', location: 'Mumbai', skillLevel: 'Intermediate+', isPrivate: false, maxMembers: 300, ownerId: 'usr-6', rules: 'Respect court timings.', status: 'ACTIVE', createdAt: iso(-150) },
    { id: 'cm-3', name: 'Pro Pickleball Circle', coverImage: null, description: 'Invite-only community for advanced and professional players.', location: 'Pan India', skillLevel: 'Advanced', isPrivate: true, maxMembers: 100, ownerId: 'usr-19', rules: 'Advanced skill level only.', status: 'ACTIVE', createdAt: iso(-90) },
    { id: 'cm-4', name: 'Pune Paddle Friends', coverImage: null, description: 'Weekend meetups and friendly matches around Pune.', location: 'Pune', skillLevel: 'Beginner', isPrivate: false, maxMembers: 200, ownerId: 'usr-15', rules: 'Beginners welcome!', status: 'ACTIVE', createdAt: iso(-60) },
  ];

  const communityMembers = [];
  let cmemId = 1;
  function addMember(communityId, userId, role, status = 'ACTIVE', off = -30) {
    communityMembers.push({ id: `cmem-${cmemId++}`, communityId, userId, role, status, joinedAt: iso(off) });
  }
  addMember('cm-1', 'usr-comm1', 'OWNER');
  addMember('cm-1', 'usr-mod1', 'MODERATOR');
  ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-9', 'usr-10'].forEach((id) => addMember('cm-1', id, 'MEMBER'));
  addMember('cm-2', 'usr-6', 'OWNER');
  ['usr-7', 'usr-8', 'usr-16', 'usr-17'].forEach((id) => addMember('cm-2', id, 'MEMBER'));
  addMember('cm-3', 'usr-19', 'OWNER');
  ['usr-20', 'usr-9', 'usr-1'].forEach((id) => addMember('cm-3', id, 'MEMBER'));
  addMember('cm-4', 'usr-15', 'OWNER');
  ['usr-16', 'usr-17', 'usr-18', 'usr-2'].forEach((id) => addMember('cm-4', id, 'MEMBER'));
  addMember('cm-3', 'usr-11', 'MEMBER', 'PENDING', -1); // private community join request

  const posts = [
    { id: 'pst-1', communityId: 'cm-1', userId: 'usr-1', type: 'Text', content: 'Great session at Smash Point today! Anyone up for doubles this weekend?', mediaUrl: null, status: 'ACTIVE', pinned: false, createdAt: iso(-1, 20) },
    { id: 'pst-2', communityId: 'cm-1', userId: 'usr-comm1', type: 'Event', content: 'New community tournament announced — check the Events tab!', mediaUrl: null, status: 'ACTIVE', pinned: true, createdAt: iso(-3, 10) },
    { id: 'pst-3', communityId: 'cm-2', userId: 'usr-6', type: 'Achievement', content: 'Just hit my 50th match milestone! 🎉', mediaUrl: null, status: 'ACTIVE', pinned: false, createdAt: iso(-2, 18) },
    { id: 'pst-4', communityId: 'cm-4', userId: 'usr-15', type: 'Poll', content: 'What time works best for weekend open play — 7 AM or 9 AM?', mediaUrl: null, status: 'ACTIVE', pinned: false, createdAt: iso(-1, 9) },
  ];
  const postLikes = [
    { id: 'lk-1', postId: 'pst-1', userId: 'usr-2', createdAt: iso(-1, 21) },
    { id: 'lk-2', postId: 'pst-1', userId: 'usr-3', createdAt: iso(-1, 21) },
    { id: 'lk-3', postId: 'pst-3', userId: 'usr-7', createdAt: iso(-2, 19) },
  ];
  const comments = [
    { id: 'cmt-1', postId: 'pst-1', userId: 'usr-2', content: 'Count me in!', createdAt: iso(-1, 21) },
    { id: 'cmt-2', postId: 'pst-3', userId: 'usr-8', content: 'Congrats! 🙌', createdAt: iso(-2, 19) },
  ];

  const communityEvents = [
    { id: 'ev-1', communityId: 'cm-1', organizerId: 'usr-comm1', name: 'Community Doubles Night', description: 'Casual doubles play open to all members.', location: 'Smash Point Pickleball Club', date: d(6), startTime: '18:00', maxParticipants: 16, entryFee: 100, status: 'REGISTRATION_OPEN', createdAt: iso(-5) },
    { id: 'ev-2', communityId: 'cm-4', organizerId: 'usr-15', name: 'Beginner Bootcamp', description: 'Learn the basics with a certified coach.', location: 'Dink & Drive Courts', date: d(10), startTime: '08:00', maxParticipants: 12, entryFee: 0, status: 'REGISTRATION_OPEN', createdAt: iso(-4) },
  ];
  const eventParticipants = [
    { id: 'evp-1', eventId: 'ev-1', userId: 'usr-1', status: 'REGISTERED', registeredAt: iso(-2) },
    { id: 'evp-2', eventId: 'ev-1', userId: 'usr-3', status: 'REGISTERED', registeredAt: iso(-1) },
  ];

  const challenges = [
    { id: 'ch-1', communityId: 'cm-1', title: 'Play 5 Games', description: 'Play 5 games this month.', targetType: 'GAMES_PLAYED', targetValue: 5, startDate: d(-10), endDate: d(20), status: 'ACTIVE', reward: 'Active Player Badge' },
    { id: 'ch-2', communityId: 'cm-1', title: 'Win 3 Games', description: 'Win 3 games in a row or otherwise.', targetType: 'GAMES_WON', targetValue: 3, startDate: d(-10), endDate: d(20), status: 'ACTIVE', reward: 'Winner Badge' },
    { id: 'ch-3', communityId: null, title: 'Improve Rating by 100 Points', description: 'Platform-wide rating growth challenge.', targetType: 'RATING_GAIN', targetValue: 100, startDate: d(-30), endDate: d(30), status: 'ACTIVE', reward: 'Most Improved Badge' },
  ];
  const challengeProgress = [
    { id: 'cp-1', challengeId: 'ch-1', userId: 'usr-1', current: 2, status: 'IN_PROGRESS' },
    { id: 'cp-2', challengeId: 'ch-2', userId: 'usr-1', current: 1, status: 'IN_PROGRESS' },
    { id: 'cp-3', challengeId: 'ch-1', userId: 'usr-2', current: 5, status: 'COMPLETED', completedAt: iso(-1) },
  ];

  // ---- Achievements catalog -----------------------------------------------------
  const achievements = [
    { id: 'ach-first-match', name: 'First Match', description: 'Play your first match.', icon: '🎾', conditionType: 'MATCHES_PLAYED', conditionValue: 1, points: 10 },
    { id: 'ach-first-win', name: 'First Win', description: 'Win your first match.', icon: '🏆', conditionType: 'WINS', conditionValue: 1, points: 10 },
    { id: 'ach-10-matches', name: '10 Matches', description: 'Play 10 matches.', icon: '🎯', conditionType: 'MATCHES_PLAYED', conditionValue: 10, points: 20 },
    { id: 'ach-50-matches', name: '50 Matches', description: 'Play 50 matches.', icon: '🔥', conditionType: 'MATCHES_PLAYED', conditionValue: 50, points: 50 },
    { id: 'ach-100-matches', name: '100 Matches', description: 'Play 100 matches.', icon: '💯', conditionType: 'MATCHES_PLAYED', conditionValue: 100, points: 100 },
    { id: 'ach-10-wins', name: '10 Wins', description: 'Win 10 matches.', icon: '⭐', conditionType: 'WINS', conditionValue: 10, points: 30 },
    { id: 'ach-5-streak', name: '5 Win Streak', description: 'Win 5 matches in a row.', icon: '⚡', conditionType: 'STREAK', conditionValue: 5, points: 40 },
    { id: 'ach-tourney-champ', name: 'Tournament Champion', description: 'Win a tournament.', icon: '🥇', conditionType: 'TOURNAMENT_WIN', conditionValue: 1, points: 100 },
    { id: 'ach-community', name: 'Community Player', description: 'Join 3 communities.', icon: '🤝', conditionType: 'COMMUNITIES_JOINED', conditionValue: 3, points: 20 },
    { id: 'ach-team-player', name: 'Team Player', description: 'Play 10 doubles matches.', icon: '👥', conditionType: 'DOUBLES_PLAYED', conditionValue: 10, points: 25 },
    { id: 'ach-most-improved', name: 'Most Improved', description: 'Gain 100+ rating points.', icon: '📈', conditionType: 'RATING_GAIN', conditionValue: 100, points: 50 },
  ];
  const userAchievements = [
    { id: 'ua-1', userId: 'usr-1', achievementId: 'ach-first-match', achievedAt: iso(-100) },
    { id: 'ua-2', userId: 'usr-1', achievementId: 'ach-first-win', achievedAt: iso(-95) },
    { id: 'ua-3', userId: 'usr-1', achievementId: 'ach-10-matches', achievedAt: iso(-40) },
    { id: 'ua-4', userId: 'usr-6', achievementId: 'ach-first-match', achievedAt: iso(-140) },
    { id: 'ua-5', userId: 'usr-6', achievementId: 'ach-10-matches', achievedAt: iso(-80) },
    { id: 'ua-6', userId: 'usr-6', achievementId: 'ach-50-matches', achievedAt: iso(-2) },
    { id: 'ua-7', userId: 'usr-19', achievementId: 'ach-tourney-champ', achievedAt: iso(-13) },
  ];

  // ---- Notifications ---------------------------------------------------------------
  const notifications = [];
  let ntfId = 1;
  function notify(userId, title, message, type, off = 0, refType = null, refId = null, isRead = false) {
    notifications.push({ id: `ntf-${ntfId++}`, userId, title, message, type, isRead, refType, refId, createdAt: iso(off) });
  }
  notify('usr-1', 'Booking Confirmed', 'Your court booking at Smash Point Pickleball Club is confirmed.', 'BOOKING_CONFIRMATION', -1, 'BOOKING', 'bk-1');
  notify('usr-1', 'Game Joined', 'You joined "Evening Doubles Fun".', 'GAME_JOINED', -1, 'GAME', 'gm-1');
  notify('usr-1', 'Tournament Registration', 'You registered for PicklePlay City Open 2026.', 'TOURNAMENT_REGISTRATION', -8, 'TOURNAMENT', 'tn-1');
  notify('usr-1', 'Match Result', 'You lost to Ishaan Singh in Pro Level Clash. Rating updated.', 'MATCH_RESULT', -5, 'GAME', 'gm-8', true);
  notify('usr-1', 'Achievement Unlocked', 'You earned the "10 Matches" badge!', 'ACHIEVEMENT_UNLOCKED', -40, 'ACHIEVEMENT', 'ach-10-matches', true);
  notify('usr-2', 'Waitlist Promoted', 'A slot opened up — you have been promoted from the waitlist.', 'WAITLIST_PROMOTION', -2, 'GAME', 'gm-3');
  notify('usr-6', 'Match Result', 'You won Sunset Doubles! Rating updated.', 'MATCH_RESULT', -1, 'GAME', 'gm-6');
  notify('usr-19', 'Tournament Winner', 'Congratulations on winning Baseline Summer Smash!', 'TOURNAMENT_WINNER', -13, 'TOURNAMENT', 'tn-2');
  notify('usr-4', 'Refund Processed', 'Your refund of ₹400 for the cancelled booking has been processed.', 'REFUND_STATUS', -5, 'BOOKING', 'bk-4');

  // ---- Support tickets --------------------------------------------------------------
  const tickets = [
    { id: 'tk-1', userId: 'usr-4', category: 'Payment', subject: 'Refund not received', description: 'I cancelled my booking 5 days ago but have not received the refund yet.', status: 'INVESTIGATING', assignedTo: 'usr-finance', responses: [{ by: 'usr-finance', message: 'Looking into this, will update within 24 hours.', at: iso(-3) }], createdAt: iso(-4), updatedAt: iso(-3) },
    { id: 'tk-2', userId: 'usr-8', category: 'Game', subject: 'Organizer cancelled without notice', description: 'The game was cancelled last minute and I was not notified in advance.', status: 'NEW', assignedTo: null, responses: [], createdAt: iso(-1), updatedAt: iso(-1) },
    { id: 'tk-3', userId: 'usr-13', category: 'Technical', subject: 'App not loading bookings', description: 'My bookings tab shows a blank screen sometimes.', status: 'RESOLVED', assignedTo: 'usr-ops', responses: [{ by: 'usr-ops', message: 'This was a caching issue, please clear local storage and try again.', at: iso(-6) }], createdAt: iso(-7), updatedAt: iso(-6) },
  ];

  // ---- Audit logs ---------------------------------------------------------------------
  const auditLogs = [
    { id: 'aud-1', adminId: 'usr-super', actorId: 'usr-super', actorRole: 'SUPER_ADMIN', actorName: 'Ananya Bose', action: 'RATING_ADJUSTED', module: 'Ratings', recordId: 'usr-1', oldValue: '1280', newValue: '1300', securityTag: 'TR-SUP-001', note: 'Manual skill adjustment per review', createdAt: iso(-20) },
    { id: 'aud-2', adminId: 'usr-ops', actorId: 'usr-ops', actorRole: 'OPS_ADMIN', actorName: 'Vikram Rao', action: 'GAME_CANCELLED', module: 'Games', recordId: 'gm-7', oldValue: 'OPEN_FOR_JOINING', newValue: 'CANCELLED', securityTag: 'TR-OPS-002', note: 'Weather disruption cancellation', createdAt: iso(-3) },
    { id: 'aud-3', adminId: 'usr-cm1', actorId: 'usr-cm1', actorRole: 'CLUB_MANAGER', actorName: 'Sanjay Gupta', action: 'COURT_MAINTENANCE_SET', module: 'Courts', recordId: 'crt-2-3', oldValue: 'AVAILABLE', newValue: 'MAINTENANCE', securityTag: 'TR-CLB-003', note: 'Court 3 net repair and line repainting', createdAt: iso(-10) },
    { id: 'aud-4', adminId: 'usr-finance', actorId: 'usr-finance', actorRole: 'FINANCE_ADMIN', actorName: 'Meera Iyer', action: 'REFUND_APPROVED', module: 'Finance', recordId: 'bk-4', oldValue: 'REFUND_PENDING', newValue: 'REFUNDED', securityTag: 'TR-FIN-004', note: 'Rain check full automatic refund', createdAt: iso(-4) },
    { id: 'aud-5', adminId: 'usr-1', actorId: 'usr-1', actorRole: 'PLAYER', actorName: 'Rahul Sharma', action: 'GAME_CREATED', module: 'Games', recordId: 'gm-1', oldValue: null, newValue: 'OPEN_FOR_JOINING', securityTag: 'TR-PLA-005', note: 'Player-created match with protected ₹250 entry fee', createdAt: iso(-1) },
  ];

  // ---- Settings (Spec Section 50) -------------------------------------------------------
  const settings = {
    booking: { maxAdvanceBookingDays: 30, cancellationWindowHours: 24, refundRules: DEFAULT_REFUND_RULES, paymentTimeoutMinutes: 10 },
    games: { minPlayers: 2, maxPlayers: 8, defaultDurationMinutes: 90, waitlistEnabled: true, waitlistPromotionTimeoutMinutes: 15 },
    tournament: { minParticipants: 4, maxParticipants: 32, withdrawalRefundRules: DEFAULT_REFUND_RULES },
    rating: { kFactor: 32, allowManualAdjustment: true },
    platform: { commissionPercent: 10, currency: 'INR', notificationsEnabled: true },
  };

  return {
    currentUserId: 'usr-1',
    users, clubs, courts, bookings, payments,
    games, gamePlayers, gameResults,
    tournaments, registrations, matches, matchResults,
    communities, communityMembers, posts, postLikes, comments,
    communityEvents, eventParticipants, challenges, challengeProgress,
    performance, ratings, achievements, userAchievements,
    notifications, tickets, auditLogs, settings,
    seedVersion: 6,
  };
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h;
}

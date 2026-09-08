import { v4 as uuidv4 } from 'uuid';

/** Short, human-friendly prefixed IDs (e.g. BK-4F2A91) used everywhere in the UI,
 *  backed by a real UUID so uniqueness is guaranteed even with dummy data resets. */
export function makeId(prefix) {
  const raw = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return prefix ? `${prefix}-${raw}` : raw;
}

export const genUserId = () => makeId('USR');
export const genClubId = () => makeId('CLB');
export const genCourtId = () => makeId('CRT');
export const genBookingId = () => makeId('BK');
export const genPaymentId = () => makeId('PAY');
export const genGameId = () => makeId('GM');
export const genGamePlayerId = () => makeId('GP');
export const genGameResultId = () => makeId('GR');
export const genTournamentId = () => makeId('TN');
export const genRegistrationId = () => makeId('REG');
export const genMatchId = () => makeId('MT');
export const genResultId = () => makeId('RS');
export const genCommunityId = () => makeId('CM');
export const genPostId = () => makeId('PST');
export const genCommentId = () => makeId('CMT');
export const genEventId = () => makeId('EV');
export const genChallengeId = () => makeId('CH');
export const genAchievementId = () => makeId('ACH');
export const genNotificationId = () => makeId('NTF');
export const genTicketId = () => makeId('TK');
export const genAuditId = () => makeId('AUD');

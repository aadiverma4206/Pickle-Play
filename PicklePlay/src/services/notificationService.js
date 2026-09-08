import { useStore } from '../store';

// Thin wrapper kept as its own module because almost every other service
// calls into it — makes the dependency explicit and easy to mock/extend
// (e.g. later routing some types to email/push as well as in-app).
export function notify(userId, title, message, type, refType = null, refId = null) {
  return useStore.getState().pushNotification(userId, title, message, type, refType, refId);
}

export function notifyMany(userIds, title, message, type, refType = null, refId = null) {
  return userIds.map((id) => notify(id, title, message, type, refType, refId));
}

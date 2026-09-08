import { genNotificationId } from '../../lib/id';

export const createNotificationsSlice = (set, get) => ({
  notifications: [],

  notificationsFor: (userId) => get().notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  unreadCountFor: (userId) => get().notifications.filter((n) => n.userId === userId && !n.isRead).length,

  pushNotification: (userId, title, message, type, refType = null, refId = null) => {
    const notification = { id: genNotificationId(), userId, title, message, type, isRead: false, refType, refId, createdAt: new Date().toISOString() };
    set((state) => { state.notifications.push(notification); });
    return notification;
  },

  markNotificationRead: (id) => {
    set((state) => {
      const n = state.notifications.find((x) => x.id === id);
      if (n) n.isRead = true;
    });
  },

  markAllRead: (userId) => {
    set((state) => {
      state.notifications.filter((n) => n.userId === userId).forEach((n) => { n.isRead = true; });
    });
  },
});

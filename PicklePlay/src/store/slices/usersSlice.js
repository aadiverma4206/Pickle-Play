import { ROLES } from '../../lib/permissions';

export const createUsersSlice = (set, get) => ({
  users: [],

  getUser: (userId) => get().users.find((u) => u.id === userId) || null,

  updateUser: (userId, patch) => {
    set((state) => {
      const u = state.users.find((x) => x.id === userId);
      if (u) Object.assign(u, patch);
    });
  },

  setUserStatus: (userId, status, adminId, reason) => {
    const before = get().getUser(userId);
    if (!before) return { ok: false, error: 'User not found.' };
    set((state) => {
      const u = state.users.find((x) => x.id === userId);
      if (u) u.status = status;
    });
    get().logAudit(adminId, 'USER_STATUS_CHANGED', 'Users', userId, before.status, status, reason);
    return { ok: true };
  },

  changeUserRole: (userId, role, adminId) => {
    const before = get().getUser(userId);
    if (!before) return { ok: false, error: 'User not found.' };
    // Super Admin is permanent once granted — it can never be reassigned away
    // (protects against ever locking the platform out of its own oversight
    // role, e.g. by accidentally demoting the only Super Admin to Player).
    if (before.role === ROLES.SUPER_ADMIN && role !== ROLES.SUPER_ADMIN) {
      return { ok: false, error: 'Super Admin cannot be changed to another role.' };
    }
    set((state) => {
      const u = state.users.find((x) => x.id === userId);
      if (u) u.role = role;
    });
    get().logAudit(adminId, 'USER_ROLE_CHANGED', 'Users', userId, before.role, role);
    return { ok: true };
  },
});

import { genAuditId } from '../../lib/id';

export const createAuditSlice = (set, get) => ({
  auditLogs: [],

  logAudit: (adminId, action, module, recordId, oldValue = null, newValue = null, note = null) => {
    const user = get().users?.find((u) => u.id === adminId);
    const actorRole = user?.role || (adminId ? 'USER' : 'SYSTEM');
    const actorName = user?.name || (adminId ? 'Staff / User' : 'System Automation');
    const timestamp = new Date().toISOString();

    const log = {
      id: genAuditId(),
      adminId,
      actorId: adminId,
      actorName,
      actorRole,
      action,
      module,
      recordId,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
      note,
      createdAt: timestamp,
      securityTag: `TR-${actorRole.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`,
    };
    set((state) => { state.auditLogs.unshift(log); });
    return log;
  },

  auditLogsFor: (recordId) => get().auditLogs.filter((l) => l.recordId === recordId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  allAuditLogs: () => [...get().auditLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  roleAuditLogs: (role) => get().auditLogs.filter((l) => l.actorRole === role),
  recentRoleActivities: (role = null, limit = 20) => {
    const logs = role ? get().auditLogs.filter((l) => l.actorRole === role) : get().auditLogs;
    return logs.slice(0, limit);
  },
});


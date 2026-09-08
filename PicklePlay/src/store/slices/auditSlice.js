import { genAuditId } from '../../lib/id';

export const createAuditSlice = (set, get) => ({
  auditLogs: [],

  logAudit: (adminId, action, module, recordId, oldValue = null, newValue = null, note = null) => {
    const log = {
      id: genAuditId(), adminId, action, module, recordId,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
      note, createdAt: new Date().toISOString(),
    };
    set((state) => { state.auditLogs.push(log); });
    return log;
  },

  auditLogsFor: (recordId) => get().auditLogs.filter((l) => l.recordId === recordId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  allAuditLogs: () => [...get().auditLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
});

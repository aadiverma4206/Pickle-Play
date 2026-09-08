export const createSettingsSlice = (set, get) => ({
  settings: null,

  updateSettings: (section, patch, adminId) => {
    const before = JSON.stringify(get().settings[section]);
    set((state) => {
      Object.assign(state.settings[section], patch);
    });
    if (adminId) get().logAudit(adminId, 'SETTINGS_UPDATED', 'Settings', section, before, JSON.stringify(get().settings[section]));
  },
});

// Transient UI state — never persisted (see partialize in store/index.js).
let toastCounter = 0;

export const createUiSlice = (set, get) => ({
  toasts: [],
  confirmDialog: null, // { title, message, confirmLabel, tone, onConfirm }

  toast: (message, tone = 'success') => {
    const id = ++toastCounter;
    set((state) => { state.toasts.push({ id, message, tone }); });
    setTimeout(() => get().dismissToast(id), 3500);
  },

  dismissToast: (id) => {
    set((state) => { state.toasts = state.toasts.filter((t) => t.id !== id); });
  },

  askConfirm: (options) => {
    set({ confirmDialog: options });
  },

  closeConfirm: () => set({ confirmDialog: null }),
});

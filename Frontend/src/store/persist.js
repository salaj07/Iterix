// LocalStorage persistence helpers
const KEY = "Iterix-state-v1";

export const loadState = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    // strip volatile UI bits
    const { ui, ...rest } = state;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {}
};

export const clearState = () => {
  try { localStorage.removeItem(KEY); } catch {}
};

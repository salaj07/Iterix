// LocalStorage persistence helpers
const KEY = "Iterix-state-v1";

export const loadState = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.workspace) {
      parsed.workspace = {
        workspaces: [],
        loading: false,
        error: null,
        ...parsed.workspace,
      };
    }
    return parsed;
  } catch {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    // Only persist auth, theme, and currentWorkspaceId. Fetch data fresh from DB on mount/reload.
    const { auth, theme, workspace } = state;
    localStorage.setItem(
      KEY,
      JSON.stringify({
        auth,
        theme,
        workspace: { currentWorkspaceId: workspace?.currentWorkspaceId },
      })
    );
  } catch {}
};

export const clearState = () => {
  try { localStorage.removeItem(KEY); } catch {}
};

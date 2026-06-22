import axios from "axios";

/**
 * Central Axios instance for all Iterix API calls.
 *
 * - baseURL: set via VITE_API_URL env var (falls back to localhost:3000)
 * - withCredentials: true so HTTP-only cookies are sent on every request
 * - Timeout: 15 seconds
 */
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error("❌ Critical: VITE_API_URL environment variable is missing in the production build!");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : ""),
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─── Request Interceptor ─────────────────────────────────────────────── */
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/* ─── Response Interceptor ────────────────────────────────────────────── */
api.interceptors.response.use(
  // 2xx responses — pass through
  (response) => response,

  // Non-2xx error handling
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Lazy-import store to avoid circular dependency at module-load time
      const { store } = await import("../store/index.js");
      const { logout } = await import("../store/slices/authSlice.js");
      store.dispatch(logout());

      try {
        localStorage.removeItem("Iterix-state-v1");
      } catch (e) {}
    }

    return Promise.reject(error);
  }
);

export default api;

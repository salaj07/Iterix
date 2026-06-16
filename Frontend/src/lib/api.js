import axios from "axios";

/**
 * Central Axios instance for all Iterix API calls.
 *
 * - baseURL: set via VITE_API_URL env var (falls back to localhost:3000)
 * - withCredentials: true so HTTP-only cookies are sent on every request
 * - Timeout: 15 seconds
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
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

      // Redirect to login only if not already there
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

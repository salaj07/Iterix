import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "@/services/auth.api";

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Send OTP to email */
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (email, { rejectWithValue }) => {
    try {
      const res = await authApi.sendOTP(email);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to send OTP" });
    }
  }
);

/** Verify OTP and log in */
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await authApi.verifyOTP(email, otp);
      return res.data; // { success, user }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Invalid OTP" });
    }
  }
);

/** Google OAuth login */
export const googleLoginAsync = createAsyncThunk(
  "auth/googleLogin",
  async (token, { rejectWithValue }) => {
    try {
      const res = await authApi.googleLogin(token);
      return res.data; // { success, message, data: { token, user } }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Google login failed" });
    }
  }
);

/** Fetch the currently logged-in user (used on app boot) */
export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.getMe();
      return res.data; // { success, data: user }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Not authenticated" });
    }
  }
);

/** Log out */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    pendingEmail: null,
    loading: false,
    error: null,
  },
  reducers: {
    /** Locally store the email we're waiting OTP for */
    issueOtp(state, { payload }) {
      state.pendingEmail = payload.email;
    },
    clearOtp(state) {
      state.pendingEmail = null;
    },
    loginSuccess(state, { payload }) {
      state.user = payload ? { ...payload, id: payload.id || payload._id } : null;
      state.isAuthenticated = !!state.user;
      state.pendingEmail = null;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.pendingEmail = null;
    },
    updateProfile(state, { payload }) {
      if (state.user) state.user = { ...state.user, ...payload };
    },
  },
  extraReducers: (builder) => {
    /* sendOtp */
    builder
      .addCase(sendOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendOtp.fulfilled, (state, { meta }) => {
        state.loading = false;
        state.pendingEmail = meta.arg; // store email
      })
      .addCase(sendOtp.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || "Failed to send OTP";
      });

    /* verifyOtp */
    builder
      .addCase(verifyOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Backend returns: { success, message, user }
        const rawUser = payload.user || payload.data?.user || null;
        if (rawUser) {
          state.user = {
            ...rawUser,
            id: rawUser.id || rawUser._id,
          };
        } else {
          state.user = null;
        }
        state.isAuthenticated = !!state.user;
        state.pendingEmail = null;
      })
      .addCase(verifyOtp.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || "OTP verification failed";
      });

    /* googleLogin */
    builder
      .addCase(googleLoginAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLoginAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Backend returns: { success, message, data: { token, user } }
        const rawUser = payload.data?.user || payload.user || null;
        if (rawUser) {
          state.user = {
            ...rawUser,
            id: rawUser.id || rawUser._id,
          };
        } else {
          state.user = null;
        }
        state.isAuthenticated = !!state.user;
        state.pendingEmail = null;
      })
      .addCase(googleLoginAsync.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || "Google login failed";
      });

    /* fetchMe */
    builder
      .addCase(fetchMe.pending, (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Backend returns: { success, data: user }
        const rawUser = payload.data || payload.user || null;
        if (rawUser) {
          state.user = {
            ...rawUser,
            id: rawUser.id || rawUser._id,
          };
        } else {
          state.user = null;
        }
        state.isAuthenticated = !!state.user;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    /* logoutUser */
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.pendingEmail = null;
      });
  },
});

export const { issueOtp, clearOtp, loginSuccess, logout, updateProfile } = slice.actions;
export default slice.reducer;

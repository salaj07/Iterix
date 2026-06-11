import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "auth",
  initialState: {
    user: null, // { id, name, email, avatarColor }
    isAuthenticated: false,
    pendingEmail: null,
    pendingOtp: null,
    otpIssuedAt: null,
  },
  reducers: {
    issueOtp(state, { payload }) {
      state.pendingEmail = payload.email;
      state.pendingOtp = payload.otp;
      state.otpIssuedAt = Date.now();
    },
    clearOtp(state) {
      state.pendingEmail = null;
      state.pendingOtp = null;
      state.otpIssuedAt = null;
    },
    loginSuccess(state, { payload }) {
      state.user = payload;
      state.isAuthenticated = true;
      state.pendingEmail = null;
      state.pendingOtp = null;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.pendingEmail = null;
      state.pendingOtp = null;
    },
    updateProfile(state, { payload }) {
      if (state.user) state.user = { ...state.user, ...payload };
    },
  },
});

export const { issueOtp, clearOtp, loginSuccess, logout, updateProfile } = slice.actions;
export default slice.reducer;

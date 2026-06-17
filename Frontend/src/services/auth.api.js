import api from "@/lib/api";

/**
 * Auth API — maps to backend /api/auth/*
 */

/** Send OTP to the given email */
export const sendOTP = (email) =>
  api.post("/api/auth/send-otp", { email });

/** Verify OTP — sets httpOnly cookie on success */
export const verifyOTP = (email, otp) =>
  api.post("/api/auth/verify-otp", { email, otp });

/** Google OAuth login */
export const googleLogin = (token) =>
  api.post("/api/auth/google", { token });

/** Get the currently authenticated user */
export const getMe = () =>
  api.get("/api/auth/me");

/** Update the authenticated user's profile */
export const updateProfile = (data) =>
  api.patch("/api/auth/profile", data);

/** Logout — clears the server-side cookie */
export const logout = () =>
  api.post("/api/auth/logout");

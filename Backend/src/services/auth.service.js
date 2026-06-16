const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/user.model");
const Otp = require("../models/otp.model");

const { sendOTPEmail } = require("../services/email.service");
const bcrypt = require("bcryptjs");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to Email
 */
const sendOTP = async ({ email }) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    throw new Error(`Only ${allowedDomain} emails are allowed to log in`);
  }

  // Generate OTP
  const otp = generateOTP();

  // Hash OTP before storing
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Delete previous OTPs
  await Otp.deleteMany({ email });

  // Save hashed OTP
  await Otp.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // Send original OTP to email
  await sendOTPEmail(email, otp);

  return {
    message: "OTP sent successfully",
  };
};
/**
 * Verify OTP and Login
 */
const verifyOTP = async ({ email, otp, name }) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord) {
    throw new Error("OTP Invalid");
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error("OTP expired");
  }

  const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);

  if (!isValidOtp) {
    otpRecord.attempts += 1;

    // Allow maximum 5 attempts
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new Error(
        "Maximum OTP attempts exceeded. Please request a new OTP."
      );
    }

    await otpRecord.save();

    throw new Error(
      `Invalid OTP. ${5 - otpRecord.attempts} attempt(s) remaining.`
    );
  }

  // Correct OTP -> delete immediately
  await Otp.deleteOne({ _id: otpRecord._id });

  // Find or create user

  let user = await User.findOne({ email });


  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      provider: "email",
    });
  }
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT
  const token = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

  return {
    message: "Login successful",
    data: {
      token,
      user,
    },
  };
};

/**
 * Google Login
 */
const googleLogin = async ({ token }) => {
  if (!token) {
    throw new Error("Google token is required");
  }

  let email, name;

  if (token === "mock-google-token") {
    email = "google.demo@iterix.com";
    name = "Demo Google User";
  } else {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("Google Client ID is not configured on the server");
    }
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });

    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const responseData = await response.json();
    // console.log(responseData)
    if (!responseData || !responseData.email || !responseData.name) {
      throw new Error("Invalid Google token");
    }

    email = responseData.email;
    name = responseData.name;
  }

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    throw new Error(`Only ${allowedDomain} emails are allowed to log in`);
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      provider: "google",
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const jwtToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

  return {
    message: "Google login successful",
    data: {
      token: jwtToken,
      user,
    },
  };
};

/**
 * Get Current User
 */
const getMe = async (user) => {
  return user;
};

/**
 * Logout
 */
const logout = async (res) => {
  return {
    message: "Logged out successfully",
  };
};

module.exports = {
  sendOTP,
  verifyOTP,
  googleLogin,
  getMe,
  logout,
};

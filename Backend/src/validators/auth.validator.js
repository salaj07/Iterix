const { body } = require("express-validator");

/** POST /api/auth/send-otp */
const sendOTPRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
];

/** POST /api/auth/verify-otp */
const verifyOTPRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
];

/** POST /api/auth/google */
const googleLoginRules = [
  body("idToken")
    .trim()
    .notEmpty()
    .withMessage("Google ID token is required"),
];

module.exports = { sendOTPRules, verifyOTPRules, googleLoginRules };

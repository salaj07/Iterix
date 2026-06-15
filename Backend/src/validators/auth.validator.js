const { body } = require("express-validator");

/** POST /api/auth/send-otp */
const sendOTPRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail()
    .custom((value) => {
      if (!value.endsWith("@medicaps.ac.in")) {
        throw new Error("Only Medicaps University emails (@medicaps.ac.in) are allowed to log in");
      }
      return true;
    }),
];

/** POST /api/auth/verify-otp */
const verifyOTPRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail()
    .custom((value) => {
      if (!value.endsWith("@medicaps.ac.in")) {
        throw new Error("Only Medicaps University emails (@medicaps.ac.in) are allowed to log in");
      }
      return true;
    }),

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
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Google ID token is required"),
];

module.exports = { sendOTPRules, verifyOTPRules, googleLoginRules };

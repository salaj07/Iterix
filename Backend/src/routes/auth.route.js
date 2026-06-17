const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authController = require("../controller/auth.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { sendOTPRules, verifyOTPRules, googleLoginRules, updateProfileRules } = require("../validators/auth.validator");

// Limit OTP sending to 5 requests per 10 minutes per IP
const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP verification to 5 attempts per 10 minutes per IP
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again after 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-otp", sendOtpLimiter, sendOTPRules, validate, authController.sendOTP);
router.post("/verify-otp", verifyOtpLimiter, verifyOTPRules, validate, authController.verifyOTP);
router.post("/google",(req,res,next)=>{
 console.log(req.body)
 next()
}, googleLoginRules, validate, authController.googleLogin);

router.get("/me", protect, authController.getMe);
router.patch("/profile", protect, updateProfileRules, validate, authController.updateProfile);
router.post("/logout", authController.logout);

module.exports = router;
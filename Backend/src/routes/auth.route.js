const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { sendOTPRules, verifyOTPRules, googleLoginRules } = require("../validators/auth.validator");

router.post("/send-otp", sendOTPRules, validate, authController.sendOTP);
router.post("/verify-otp", verifyOTPRules, validate, authController.verifyOTP);
router.post("/google", googleLoginRules, validate, authController.googleLogin);

router.get("/me", protect, authController.getMe);
router.post("/logout", authController.logout);

module.exports = router;
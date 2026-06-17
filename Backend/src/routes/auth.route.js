const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { sendOTPRules, verifyOTPRules, googleLoginRules, updateProfileRules } = require("../validators/auth.validator");

router.post("/send-otp", sendOTPRules, validate, authController.sendOTP);
router.post("/verify-otp", verifyOTPRules, validate, authController.verifyOTP);
router.post("/google",(req,res,next)=>{
 console.log(req.body)
 next()
}, googleLoginRules, validate, authController.googleLogin);

router.get("/me", protect, authController.getMe);
router.patch("/profile", protect, updateProfileRules, validate, authController.updateProfile);
router.post("/logout", authController.logout);

module.exports = router;
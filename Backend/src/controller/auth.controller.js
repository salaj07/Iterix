const authService = require("../services/auth.service");

const sendOTP = async (req, res, next) => {
  try {
    const result = await authService.sendOTP(req.body);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data || null,
    });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const result = await authService.verifyOTP(req.body);
    res.cookie("token", result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.data.user,
    });

  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    console.log(req.body)
    const result = await authService.googleLogin(req.body);

    res.cookie("token", result.data.token, {

      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days

    });
    
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // Clear the auth cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  googleLogin,
  getMe,
  logout,
};
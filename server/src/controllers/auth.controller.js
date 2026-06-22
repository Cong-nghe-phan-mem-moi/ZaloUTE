const AuthRepository = require("../repositories/auth.repository");
const OtpRepository = require("../repositories/otp.repository");
const authService = require("../services/auth.service");

const saveResetPasswordSession = (req, email) => {
  if (!req.session) {
    throw {
      statusCode: 500,
      code: "SESSION_NOT_AVAILABLE",
      message: "Session middleware is not configured.",
    };
  }

  req.session.allowResetPassword = {
    email,
    expiresAt:
      Date.now() + authService.RESET_PASSWORD_SESSION_MINUTES * 60 * 1000,
  };

  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const clearResetPasswordSession = (req) => {
  if (!req.session) {
    return Promise.resolve();
  }

  delete req.session.allowResetPassword;

  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

// Register Controller
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const result = await authService.register(fullName, email, password);

    res.status(201).json(result);
  } catch (error) {
    console.error("Register error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "REGISTER_FAILED",
      message: error.message || "Operation failed",
    });
  }
};

// Verify OTP Controller
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyOTP(email, otp);

    res.status(200).json(result);
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "VERIFY_OTP_FAILED",
      message: error.message || "Operation failed",
    });
  }
};

const requestPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordResetOTP(email);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "FORGOT_PASSWORD_FAILED",
      message: error.message || "Operation failed",
    });
  }
};

const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyPasswordResetOTP(email, otp);

    await saveResetPasswordSession(req, result.data.email);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "OTP_VERIFY_FAILED",
      message: error.message || "Operation failed",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const email = req.resetPasswordEmail;

    const result = await authService.resetPassword(email, newPassword);
    await clearResetPasswordSession(req);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "RESET_PASSWORD_FAILED",
      message: error.message || "Operation failed",
    });
  }
};

const getResetOtpDev = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Endpoint not available in production",
    });
  }

  try {
    const email = req.query.email || req.body?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const account = await AuthRepository.findAccountByEmail(email);
    const otp = await OtpRepository.findLatestPendingOtp(
      email,
      authService.OTP_TYPE_RESET_PASSWORD,
    );

    if (!account || !otp?.code) {
      return res.status(404).json({
        success: false,
        message: "Reset OTP not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        email: account.email,
        otp: otp.code,
        expiresAt: otp.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reset OTP",
      error: error.message,
    });
  }
};
// [POST] /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required!!!",
      });
    }

    const result = await authService.login(email, password, {
      userAgent: req.get("user-agent") || "",
      ipAddress: req.ip || req.socket?.remoteAddress || "",
    });
    res.status(200).json({
      success: true,
      message: "Login successful!!!",
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      code: error.code || "LOGIN_FAILED",
      message: error.message,
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  getResetOtpDev,
  login,
};




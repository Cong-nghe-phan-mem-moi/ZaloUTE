const AuthRepository = require("../repo/auth.repository");
const authService = require("../service/auth.service");

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
      message: error.message || "Lỗi đăng ký. Vui lòng thử lại.",
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
      message: error.message || "Lỗi xác thực OTP. Vui lòng thử lại.",
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
      message: error.message || "Không thể gửi OTP. Vui lòng thử lại.",
    });
  }
};

const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyPasswordResetOTP(email, otp);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "OTP_VERIFY_FAILED",
      message: error.message || "Xác thực OTP thất bại.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const accountId = req.resetToken?.accountId;

    const result = await authService.resetPassword(accountId, newPassword);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "RESET_PASSWORD_FAILED",
      message: error.message || "Đặt lại mật khẩu thất bại.",
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
    if (!account || !account.resetOtp?.code) {
      return res.status(404).json({
        success: false,
        message: "Reset OTP not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        email: account.email,
        otp: account.resetOtp.code,
        expiresAt: account.resetOtp.expiresAt,
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

    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      message: "Login successful!!!",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
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

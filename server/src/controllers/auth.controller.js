const bcrypt = require("bcrypt");
const User = require("../models/User");
const Account = require("../models/Account");
const { sendOTPEmail } = require("../config/mailer");
const AuthService = require("../service/AuthService");
const AuthRepository = require("../repo/AuthRepository");
const jwt = require("jsonwebtoken");
const authService = require("../service/auth.service");

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register Controller
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if account already exists
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return res
        .status(400)
        .json({ success: false, message: "Email này đã được đăng ký" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Create user profile
    const newUser = new User({ fullName, email });
    await newUser.save();

    // Create account linked to user
    const newAccount = new Account({
      email,
      passwordHash: hashedPassword,
      provider: 'local',
      isVerified: false,
      otp: { code: otp, expiresAt: otpExpiry },
      user: newUser._id,
    });
    await newAccount.save();

    // Update user with account reference
    newUser.account = newAccount._id;
    await newUser.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      // Delete account and user if email sending fails
      await Account.deleteOne({ email });
      await User.deleteOne({ _id: newUser._id });
      return res.status(500).json({
        success: false,
        message: "Không thể gửi email. Vui lòng thử lại.",
      });
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng xác thực OTP",
      data: { email, message: "OTP đã được gửi đến email của bạn" },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi đăng ký. Vui lòng thử lại.",
      error: error.message,
    });
  }
};

// Verify OTP Controller
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find account by email
    const account = await Account.findOne({ email }).populate("user");
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Check if already verified
    if (account.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Tài khoản đã được xác thực" });
    }

    // Check if OTP exists
    if (!account.otp || !account.otp.code) {
      return res.status(400).json({
        success: false,
        message: "OTP không tồn tại. Vui lòng đăng ký lại",
      });
    }

    // Check if OTP expired
    if (new Date() > account.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP đã hết hạn. Vui lòng đăng ký lại",
      });
    }

    // Verify OTP code
    if (account.otp.code !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP không chính xác" });
    }

    // Mark account as verified and remove OTP
    account.isVerified = true;
    account.otp = null;
    await account.save();

    res.status(200).json({
      success: true,
      message: "Xác thực OTP thành công!",
      data: { email: account.email, isVerified: true },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác thực OTP. Vui lòng thử lại.",
      error: error.message,
    });
  }
};

const requestPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await AuthService.requestPasswordResetOTP(email);

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
    const result = await AuthService.verifyPasswordResetOTP(email, otp);

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

    const result = await AuthService.resetPassword(accountId, newPassword);

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
      })
    }

    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      message: "Login successful!!!",
      data: result
    })


  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

module.exports = {
  register,
  verifyOTP,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  getResetOtpDev,
  login,
};





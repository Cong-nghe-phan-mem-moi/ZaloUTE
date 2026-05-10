const bcrypt = require("bcrypt");
const User = require("../models/User");
const Account = require("../models/Account");
const { sendOTPEmail } = require("../config/mailer");

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
      isVerified: false,
      otp: { code: otp, expiresAt: otpExpiry },
      user: newUser._id,
    });
    await newAccount.save();

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

module.exports = {
  register,
  verifyOTP,
};

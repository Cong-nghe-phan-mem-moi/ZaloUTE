const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuthRepository = require("../repo/auth.repository");
const UserRepository = require("../repo/user.repository");
const { sendPasswordResetOTP } = require("../config/mailer");
const { sendOTPEmail } = require("../config/mailer");
const { generateOTP, isOTPExpired } = require("../utils/otp");

const RESET_TOKEN_EXPIRY_MINUTES = 10;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const register = async (fullName, email, password) => {
  const normalizedEmail = email.toLowerCase();
  let createdUser = null;

  const [existingAccount, existingUser] = await Promise.all([
    AuthRepository.findAccountByEmail(normalizedEmail),
    UserRepository.findByEmail(normalizedEmail),
  ]);

  if (existingAccount || existingUser) {
    throw {
      statusCode: 400,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "Email này đã được đăng ký",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  try {
    createdUser = await UserRepository.createUser({
      fullName,
      email: normalizedEmail,
    });

    const newAccount = await AuthRepository.createAccount({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      provider: "local",
      isVerified: false,
      otp: { code: otp, expiresAt: otpExpiry },
      user: createdUser._id,
    });

    await UserRepository.linkAccountToUser(createdUser._id, newAccount._id);

    const emailResult = await sendOTPEmail(normalizedEmail, otp);

    if (!emailResult.success) {
      throw {
        statusCode: 500,
        code: "EMAIL_SEND_FAILED",
        message: "Không thể gửi email. Vui lòng thử lại.",
      };
    }
  } catch (error) {
    if (createdUser?._id) {
      await AuthRepository.deleteAccountByEmail(normalizedEmail).catch(
        () => {},
      );
      await UserRepository.deleteUserById(createdUser._id).catch(() => {});
    }

    throw error;
  }

  return {
    success: true,
    message: "Đăng ký thành công! Vui lòng xác thực OTP",
    data: {
      email: normalizedEmail,
      message: "OTP đã được gửi đến email của bạn",
    },
  };
};

const verifyOTP = async (email, otp) => {
  const account = await AuthRepository.findAccountByEmail(email);

  if (!account) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "Người dùng không tồn tại",
    };
  }

  if (account.isVerified) {
    throw {
      statusCode: 400,
      code: "ALREADY_VERIFIED",
      message: "Tài khoản đã được xác thực",
    };
  }

  if (!account.otp || !account.otp.code) {
    throw {
      statusCode: 400,
      code: "OTP_NOT_FOUND",
      message: "OTP không tồn tại. Vui lòng đăng ký lại",
    };
  }

  if (new Date() > account.otp.expiresAt) {
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED",
      message: "OTP đã hết hạn. Vui lòng đăng ký lại",
    };
  }

  if (account.otp.code !== otp) {
    throw {
      statusCode: 400,
      code: "OTP_INVALID",
      message: "OTP không chính xác",
    };
  }

  const verifiedAccount = await AuthRepository.markEmailVerified(account._id);

  return {
    success: true,
    message: "Xác thực OTP thành công!",
    data: { email: verifiedAccount.email, isVerified: true },
  };
};

const login = async (email, password) => {
  const account = await AuthRepository.findAccountByEmail(email);

  if (!account) {
    throw new Error("Account not found!!!");
  }

  if (account.provider !== "local") {
    throw new Error("Please login with correct method!!!");
  }

  if (!account.isVerified) {
    throw new Error(
      "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực OTP!!!",
    );
  }

  const isMatch = await bcrypt.compare(password, account.passwordHash);

  if (!isMatch) {
    throw new Error("Password is incorrect!!!");
  }

  const payload = {
    id: account._id,
    email: account.email,
    role: account.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  const redirectUrl =
    account.role === "admin" ? "/admin/profile" : "/user/profile";

  return {
    token: token,
    redirectUrl: redirectUrl,
  };
};

const requestPasswordResetOTP = async (email) => {
  const account = await AuthRepository.findAccountByEmail(email);

  if (!account) {
    return {
      success: true,
      message: "Nếu email tồn tại, mã OTP đã được gửi.",
    };
  }

  if (account.provider && account.provider !== "local") {
    throw {
      statusCode: 400,
      code: "INVALID_PROVIDER",
      message: "Tài khoản này không hỗ trợ đặt lại mật khẩu bằng email.",
    };
  }

  const otp = generateOTP();
  const resetOtp = {
    code: otp,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    verifiedAt: null,
    attempts: 0,
  };

  await AuthRepository.updateResetOtp(account._id, resetOtp);

  const emailResult = await sendPasswordResetOTP(account.email, otp);

  if (!emailResult.success) {
    throw {
      statusCode: 500,
      code: "EMAIL_SEND_FAILED",
      message: "Không thể gửi email. Vui lòng thử lại.",
    };
  }

  return {
    success: true,
    message: "Nếu email tồn tại, mã OTP đã được gửi.",
  };
};

const verifyPasswordResetOTP = async (email, otp) => {
  const account = await AuthRepository.findAccountByEmail(email);

  if (!account || !account.resetOtp || !account.resetOtp.code) {
    throw {
      statusCode: 400,
      code: "OTP_NOT_FOUND",
      message: "OTP không tồn tại hoặc đã hết hạn.",
    };
  }

  if (isOTPExpired(account.resetOtp.expiresAt)) {
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED",
      message: "OTP đã hết hạn. Vui lòng yêu cầu lại.",
    };
  }

  if (account.resetOtp.attempts >= OTP_MAX_ATTEMPTS) {
    throw {
      statusCode: 429,
      code: "OTP_ATTEMPTS_EXCEEDED",
      message: "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu lại.",
    };
  }

  if (account.resetOtp.code !== otp) {
    const currentResetOtp = account.resetOtp.toObject
      ? account.resetOtp.toObject()
      : account.resetOtp;

    await AuthRepository.updateResetOtp(account._id, {
      ...currentResetOtp,
      attempts: (account.resetOtp.attempts || 0) + 1,
    });

    throw {
      statusCode: 400,
      code: "OTP_INVALID",
      message: "OTP không chính xác.",
    };
  }

  const currentResetOtp = account.resetOtp.toObject
    ? account.resetOtp.toObject()
    : account.resetOtp;

  const updatedOtp = {
    ...currentResetOtp,
    verifiedAt: new Date(),
  };

  await AuthRepository.updateResetOtp(account._id, updatedOtp);

  const resetToken = jwt.sign(
    {
      accountId: account._id.toString(),
      email: account.email,
      type: "password_reset",
    },
    process.env.JWT_SECRET,
    { expiresIn: `${RESET_TOKEN_EXPIRY_MINUTES}m` },
  );

  return {
    success: true,
    message: "Xác thực OTP thành công.",
    data: { resetToken, expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES },
  };
};

const resetPassword = async (accountId, newPassword) => {
  if (!accountId) {
    throw {
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Reset token is missing or invalid.",
    };
  }

  const account = await AuthRepository.findAccountById(accountId);

  if (!account || !account.resetOtp) {
    throw {
      statusCode: 400,
      code: "RESET_NOT_REQUESTED",
      message: "Bạn chưa yêu cầu đặt lại mật khẩu.",
    };
  }

  if (!account.resetOtp.verifiedAt) {
    throw {
      statusCode: 400,
      code: "OTP_NOT_VERIFIED",
      message: "OTP chưa được xác thực.",
    };
  }

  if (isOTPExpired(account.resetOtp.expiresAt)) {
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED",
      message: "OTP đã hết hạn. Vui lòng yêu cầu lại.",
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await AuthRepository.updatePasswordHash(account._id, passwordHash);
  await AuthRepository.clearResetOtp(account._id);

  return {
    success: true,
    message: "Đặt lại mật khẩu thành công.",
  };
};

module.exports = {
  register,
  verifyOTP,
  login,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
};

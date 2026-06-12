const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuthRepository = require("../repo/auth.repository");
const UserRepository = require("../repo/user.repository");
const OtpRepository = require("../repo/otp.repository");
const { sendPasswordResetOTP, sendOTPEmail } = require("../config/mailer");
const { generateOTP, isOTPExpired } = require("../utils/otp");

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const RESET_PASSWORD_SESSION_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_TYPE_VERIFY_EMAIL = "verify_email";
const OTP_TYPE_RESET_PASSWORD = "reset_password";

const normalizeEmail = (email) => email.trim().toLowerCase();

const validateOtp = async (otpDoc, otp) => {
  if (!otpDoc) {
    throw {
      statusCode: 400,
      code: "OTP_NOT_FOUND",
      message: "OTP không tồn tại hoặc đã hết hạn.",
    };
  }

  if (isOTPExpired(otpDoc.expiresAt)) {
    await OtpRepository.markOtpUsed(otpDoc._id);
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED",
      message: "OTP đã hết hạn. Vui lòng yêu cầu lại.",
    };
  }

  if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
    throw {
      statusCode: 429,
      code: "OTP_ATTEMPTS_EXCEEDED",
      message: "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu lại.",
    };
  }

  if (otpDoc.code !== otp) {
    await OtpRepository.incrementAttempts(otpDoc._id);
    throw {
      statusCode: 400,
      code: "OTP_INVALID",
      message: "OTP không chính xác.",
    };
  }
};

const createOtpForEmail = async (email, type) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpRepository.markPendingOtpsUsed(email, type);
  await OtpRepository.createOtp({
    email,
    code: otp,
    type,
    expiresAt,
  });

  return otp;
};

const register = async (fullName, email, password) => {
  const normalizedEmail = normalizeEmail(email);
  let createdUser = null;

  const existingAccount = await AuthRepository.findAccountByEmail(normalizedEmail);

  if (existingAccount) {
    throw {
      statusCode: 400,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "Email này đã được đăng ký",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    createdUser = await UserRepository.createUser({
      fullName,
    });

    const newAccount = await AuthRepository.createAccount({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      status: "pending",
      user: createdUser._id,
    });

    await UserRepository.linkAccountToUser(createdUser._id, newAccount._id);

    const otp = await createOtpForEmail(normalizedEmail, OTP_TYPE_VERIFY_EMAIL);
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
      await OtpRepository.markPendingOtpsUsed(
        normalizedEmail,
        OTP_TYPE_VERIFY_EMAIL,
      ).catch(() => {});
    }

    throw error;
  }

  return {
    success: true,
    message: "Đăng ký thành công! Vui lòng xác thực OTP",
    data: {
      email: normalizedEmail,
      status: "pending",
      message: "OTP đã được gửi đến email của bạn",
    },
  };
};

const verifyOTP = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const account = await AuthRepository.findAccountByEmail(normalizedEmail);

  if (!account) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "Người dùng không tồn tại",
    };
  }

  if (account.status === "active") {
    throw {
      statusCode: 400,
      code: "ALREADY_VERIFIED",
      message: "Tài khoản đã được xác thực",
    };
  }

  if (account.status !== "pending") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_STATUS_INVALID",
      message: "Tài khoản không ở trạng thái chờ xác thực",
    };
  }

  const otpDoc = await OtpRepository.findLatestPendingOtp(
    normalizedEmail,
    OTP_TYPE_VERIFY_EMAIL,
  );

  await validateOtp(otpDoc, otp);
  await OtpRepository.markOtpUsed(otpDoc._id);

  const activeAccount = await AuthRepository.updateAccountStatus(
    account._id,
    "active",
  );

  return {
    success: true,
    message: "Xác thực OTP thành công!",
    data: { email: activeAccount.email, status: activeAccount.status },
  };
};

const login = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const account = await AuthRepository.findAccountByEmail(normalizedEmail, {
    includePassword: true,
  });

  if (!account) {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_FOUND",
      message: "Account not found!!!",
    };
  }

  if (account.status === "pending") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_PENDING",
      message:
        "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực OTP!!!",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 403,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Tài khoản không được phép đăng nhập.",
    };
  }

  const isMatch = await bcrypt.compare(password, account.passwordHash);

  if (!isMatch) {
    throw {
      statusCode: 400,
      code: "INVALID_PASSWORD",
      message: "Password is incorrect!!!",
    };
  }


  if (!account.user) {
    throw {
      statusCode: 500,
      code: "ACCOUNT_USER_NOT_LINKED",
      message: "Account chưa được liên kết với user.",
    };
  }

  const accountId = account._id.toString();
  const userId = account.user._id ? account.user._id.toString() : account.user.toString();
  const payload = {
    id: userId,
    accountId,
    userId,
    email: account.email,
    role: account.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
  const redirectUrl =
    account.role === "admin" ? "/admin/dashboard" : "/user/profile";

  return {
    token,
    redirectUrl,
  };
};

const requestPasswordResetOTP = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const account = await AuthRepository.findAccountByEmail(normalizedEmail);

  if (!account) {
    throw {
      statusCode: 404,
      code: "ACCOUNT_NOT_FOUND",
      message: "Tài khoản không tồn tại.",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Tài khoản chưa sẵn sàng để đặt lại mật khẩu.",
    };
  }

  const otp = await createOtpForEmail(account.email, OTP_TYPE_RESET_PASSWORD);
  const emailResult = await sendPasswordResetOTP(account.email, otp);

  if (!emailResult.success) {
    await OtpRepository.markPendingOtpsUsed(
      account.email,
      OTP_TYPE_RESET_PASSWORD,
    ).catch(() => {});

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
  const normalizedEmail = normalizeEmail(email);
  const account = await AuthRepository.findAccountByEmail(normalizedEmail);
  const otpDoc = await OtpRepository.findLatestPendingOtp(
    normalizedEmail,
    OTP_TYPE_RESET_PASSWORD,
  );

  if (!account) {
    throw {
      statusCode: 400,
      code: "OTP_NOT_FOUND",
      message: "OTP không tồn tại hoặc đã hết hạn.",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Tài khoản chưa sẵn sàng để đặt lại mật khẩu.",
    };
  }

  await validateOtp(otpDoc, otp);
  await OtpRepository.markOtpUsed(otpDoc._id);

  const resetToken = jwt.sign(
    {
      email: account.email,
      type: OTP_TYPE_RESET_PASSWORD,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: `${RESET_PASSWORD_SESSION_MINUTES}m`,
    },
  );

  return {
    success: true,
    message: "Xác thực OTP thành công.",
    data: {
      email: account.email,
      redirectUrl: "/reset-password",
      expiresInMinutes: RESET_PASSWORD_SESSION_MINUTES,
      resetToken,
    },
  };
};

const resetPassword = async (email, newPassword) => {
  if (!email) {
    throw {
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Reset session is missing or invalid.",
    };
  }

  const account = await AuthRepository.findAccountByEmail(email);

  if (!account) {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_FOUND",
      message: "Tài khoản không tồn tại.",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Tài khoản không được phép đặt lại mật khẩu.",
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await AuthRepository.updatePasswordHash(account._id, passwordHash);
  await OtpRepository.markPendingOtpsUsed(account.email, OTP_TYPE_RESET_PASSWORD);

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
  RESET_PASSWORD_SESSION_MINUTES,
  OTP_TYPE_RESET_PASSWORD,
};

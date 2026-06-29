const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const AuthRepository = require("../repositories/auth.repository");
const UserRepository = require("../repositories/user.repository");
const OtpRepository = require("../repositories/otp.repository");
const { sendPasswordResetOTP, sendOTPEmail } = require("../config/mailer");
const { generateOTP, isOTPExpired } = require("../utils/otp");

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const RESET_PASSWORD_SESSION_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_TYPE_VERIFY_EMAIL = "verify_email";
const OTP_TYPE_RESET_PASSWORD = "reset_password";

const normalizeEmail = (email) => email.trim().toLowerCase();

const getGoogleClientIds = () =>
  String(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "")
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean);

const buildGoogleFullName = (name, email) => {
  const fallbackName = String(email || "").split("@")[0] || "Google User";
  const fullName = String(name || fallbackName).replace(/\s+/g, " ").trim();

  if (fullName.length >= 3) {
    return fullName.slice(0, 100);
  }

  return `${fullName} User`.slice(0, 100);
};

const verifyGoogleCredential = async (credential) => {
  const clientIds = getGoogleClientIds();

  if (!clientIds.length) {
    throw {
      statusCode: 500,
      code: "GOOGLE_AUTH_NOT_CONFIGURED",
      message: "Google login is not configured",
    };
  }

  if (!credential) {
    throw {
      statusCode: 400,
      code: "GOOGLE_CREDENTIAL_REQUIRED",
      message: "Google credential is required",
    };
  }

  try {
    const oauthClient = new google.auth.OAuth2(clientIds[0]);
    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: clientIds.length === 1 ? clientIds[0] : clientIds,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email) {
      throw new Error("Google token payload is missing required fields");
    }

    if (payload.email_verified !== true && payload.email_verified !== "true") {
      throw {
        statusCode: 403,
        code: "GOOGLE_EMAIL_NOT_VERIFIED",
        message: "Google email is not verified",
      };
    }

    return {
      googleId: payload.sub,
      email: normalizeEmail(payload.email),
      fullName: buildGoogleFullName(payload.name, payload.email),
      avatar: payload.picture || null,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw {
      statusCode: 401,
      code: "GOOGLE_TOKEN_INVALID",
      message: "Google credential is invalid",
    };
  }
};

const ensureAccountCanLogin = async (account, options = {}) => {
  if (account.status === "pending") {
    if (!options.allowPendingActivation) {
      throw {
        statusCode: 400,
        code: "ACCOUNT_PENDING",
        message: "Operation failed",
      };
    }

    account = await AuthRepository.updateAccountStatus(account._id, "active");
  }

  if (
    account.status === "suspended" &&
    account.suspendedUntil &&
    new Date(account.suspendedUntil).getTime() <= Date.now()
  ) {
    account.status = "active";
    account.suspendedUntil = null;
    account.suspensionReason = "";
    await account.save();
  }

  if (account.status === "suspended") {
    throw {
      statusCode: 403,
      code: "ACCOUNT_SUSPENDED",
      message: account.suspendedUntil
        ? `Account is suspended until ${new Date(account.suspendedUntil).toLocaleString()}`
        : "Account is suspended",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 403,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Operation failed",
    };
  }

  if (!account.user) {
    throw {
      statusCode: 500,
      code: "ACCOUNT_USER_NOT_LINKED",
      message: "Operation failed",
    };
  }

  return account;
};

const createLoginResult = async (account, sessionMeta = {}) => {
  const accountId = account._id.toString();
  const userId = account.user._id
    ? account.user._id.toString()
    : account.user.toString();
  const sessionId = crypto.randomUUID();
  const payload = {
    id: userId,
    accountId,
    userId,
    email: account.email,
    role: account.role,
    sessionId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
  await AuthRepository.addLoginSession(accountId, {
    sessionId,
    userAgent: sessionMeta.userAgent || "",
    ipAddress: sessionMeta.ipAddress || "",
    createdAt: new Date(),
    lastActiveAt: new Date(),
  });

  const redirectUrl =
    account.role === "admin" ? "/admin/dashboard" : "/";

  return {
    token,
    redirectUrl,
  };
};

const validateOtp = async (otpDoc, otp) => {
  if (!otpDoc) {
    throw {
      statusCode: 400,
      code: "OTP_NOT_FOUND",
      message: "Operation failed",
    };
  }

  if (isOTPExpired(otpDoc.expiresAt)) {
    await OtpRepository.markOtpUsed(otpDoc._id);
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED",
      message: "Operation failed",
    };
  }

  if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
    throw {
      statusCode: 429,
      code: "OTP_ATTEMPTS_EXCEEDED",
      message: "Operation failed",
    };
  }

  if (otpDoc.code !== otp) {
    await OtpRepository.incrementAttempts(otpDoc._id);
    throw {
      statusCode: 400,
      code: "OTP_INVALID",
      message: "Operation failed",
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
      message: "Operation failed",
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
        message: "Operation failed",
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
    message: "Operation failed",
    data: {
      email: normalizedEmail,
      status: "pending",
      message: "Operation failed",
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
      message: "Operation failed",
    };
  }

  if (account.status === "active") {
    throw {
      statusCode: 400,
      code: "ALREADY_VERIFIED",
      message: "Operation failed",
    };
  }

  if (account.status !== "pending") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_STATUS_INVALID",
      message: "Operation failed",
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
    message: "Operation failed",
    data: { email: activeAccount.email, status: activeAccount.status },
  };
};

const login = async (email, password, sessionMeta = {}) => {
  const normalizedEmail = normalizeEmail(email);
  let account = await AuthRepository.findAccountByEmail(normalizedEmail, {
    includePassword: true,
  });

  if (!account) {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_FOUND",
      message: "Account not found!!!",
    };
  }

  account = await ensureAccountCanLogin(account);

  if (!account.passwordHash) {
    throw {
      statusCode: 400,
      code: "PASSWORD_LOGIN_UNAVAILABLE",
      message: "Please continue with Google for this account",
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


  return createLoginResult(account, sessionMeta);
};

const googleLogin = async (credential, sessionMeta = {}) => {
  const googleProfile = await verifyGoogleCredential(credential);
  let account = await AuthRepository.findAccountByGoogleId(
    googleProfile.googleId,
  );

  if (!account) {
    account = await AuthRepository.findAccountByEmail(googleProfile.email);
  }

  if (!account) {
    const createdUser = await UserRepository.createUser({
      fullName: googleProfile.fullName,
      avatar: googleProfile.avatar,
    });

    try {
      account = await AuthRepository.createAccount({
        email: googleProfile.email,
        authProvider: "google",
        googleId: googleProfile.googleId,
        status: "active",
        user: createdUser._id,
      });

      await UserRepository.linkAccountToUser(createdUser._id, account._id);
    } catch (error) {
      await UserRepository.deleteUserById(createdUser._id).catch(() => {});
      throw error;
    }
  } else {
    const updateData = {};

    if (!account.googleId) {
      updateData.googleId = googleProfile.googleId;
    }

    if (account.status === "pending") {
      updateData.status = "active";
    }

    if (Object.keys(updateData).length) {
      account = await AuthRepository.updateAccountFields(
        account._id,
        updateData,
      );
    }
  }

  account = await ensureAccountCanLogin(account, {
    allowPendingActivation: true,
  });

  return createLoginResult(account, sessionMeta);
};

const requestPasswordResetOTP = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const account = await AuthRepository.findAccountByEmail(normalizedEmail);

  if (!account) {
    throw {
      statusCode: 404,
      code: "ACCOUNT_NOT_FOUND",
      message: "Operation failed",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Operation failed",
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
      message: "Operation failed",
    };
  }

  return {
    success: true,
    message: "Operation failed",
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
      message: "Operation failed",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Operation failed",
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
    message: "Operation failed",
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
      message: "Operation failed",
    };
  }

  if (account.status !== "active") {
    throw {
      statusCode: 400,
      code: "ACCOUNT_NOT_ACTIVE",
      message: "Operation failed",
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await AuthRepository.updatePasswordHash(account._id, passwordHash);
  await OtpRepository.markPendingOtpsUsed(account.email, OTP_TYPE_RESET_PASSWORD);

  return {
    success: true,
    message: "Operation failed",
  };
};

module.exports = {
  register,
  verifyOTP,
  login,
  googleLogin,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  RESET_PASSWORD_SESSION_MINUTES,
  OTP_TYPE_RESET_PASSWORD,
};




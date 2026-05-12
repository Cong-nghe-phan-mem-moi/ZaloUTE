const Otp = require("../models/otp.model");

const normalizeEmail = (email) => email.trim().toLowerCase();

const createOtp = async ({ email, code, type, expiresAt }) => {
  return Otp.create({
    email: normalizeEmail(email),
    code,
    type,
    expiresAt,
    attempts: 0,
    isUsed: false,
  });
};

const findLatestPendingOtp = async (email, type) => {
  return Otp.findOne({
    email: normalizeEmail(email),
    type,
    isUsed: false,
  }).sort({ createdAt: -1 });
};

const markOtpUsed = async (otpId) => {
  return Otp.findByIdAndUpdate(
    otpId,
    { isUsed: true },
    { returnDocument: "after" },
  );
};

const markPendingOtpsUsed = async (email, type) => {
  return Otp.updateMany(
    {
      email: normalizeEmail(email),
      type,
      isUsed: false,
    },
    { isUsed: true },
  );
};

const incrementAttempts = async (otpId) => {
  return Otp.findByIdAndUpdate(
    otpId,
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
};

module.exports = {
  createOtp,
  findLatestPendingOtp,
  markOtpUsed,
  markPendingOtpsUsed,
  incrementAttempts,
};

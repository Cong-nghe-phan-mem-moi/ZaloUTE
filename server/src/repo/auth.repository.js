const Account = require("../models/account.model");

const createAccount = async (accountData) => {
  return new Account(accountData).save();
};

const deleteAccountByEmail = async (email) => {
  return Account.deleteOne({ email: email.toLowerCase() });
};

const findAccountByEmail = async (email) => {
  return Account.findOne({ email: email.toLowerCase() });
};

const findAccountById = async (accountId) => {
  return Account.findById(accountId);
};

const updateResetOtp = async (accountId, resetOtp) => {
  return Account.findByIdAndUpdate(
    accountId,
    { resetOtp },
    { returnDocument: "after" },
  );
};

const clearResetOtp = async (accountId) => {
  return Account.findByIdAndUpdate(
    accountId,
    { resetOtp: null },
    { returnDocument: "after" },
  );
};

const updatePasswordHash = async (accountId, passwordHash) => {
  return Account.findByIdAndUpdate(
    accountId,
    { passwordHash },
    { returnDocument: "after" },
  );
};

const markEmailVerified = async (accountId) => {
  return Account.findByIdAndUpdate(
    accountId,
    { isVerified: true, otp: null },
    { returnDocument: "after" },
  );
};

module.exports = {
  createAccount,
  deleteAccountByEmail,
  findAccountByEmail,
  findAccountById,
  updateResetOtp,
  clearResetOtp,
  updatePasswordHash,
  markEmailVerified,
};

const Account = require('../models/Account');


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
    { returnDocument: 'after' },
  );
};

const clearResetOtp = async (accountId) => {
  return Account.findByIdAndUpdate(
    accountId,
    { resetOtp: null },
    { returnDocument: 'after' },
  );
};

const updatePasswordHash = async (accountId, passwordHash) => {
  return Account.findByIdAndUpdate(
    accountId,
    { passwordHash },
    { returnDocument: 'after' },
  );
};

module.exports = {
  findAccountByEmail,
  findAccountById,
  updateResetOtp,
  clearResetOtp,
  updatePasswordHash,
};


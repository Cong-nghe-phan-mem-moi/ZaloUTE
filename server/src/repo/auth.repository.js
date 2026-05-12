const Account = require("../models/account.model");

const normalizeEmail = (email) => email.trim().toLowerCase();

const createAccount = async (accountData) => {
  return new Account(accountData).save();
};

const deleteAccountByEmail = async (email) => {
  return Account.deleteOne({ email: normalizeEmail(email) });
};

const findAccountByEmail = async (email, options = {}) => {
  const query = Account.findOne({ email: normalizeEmail(email) });

  if (options.includePassword) {
    query.select("+passwordHash");
  }

  return query;
};

const findAccountById = async (accountId) => {
  return Account.findById(accountId);
};

const updatePasswordHash = async (accountId, passwordHash) => {
  return Account.findByIdAndUpdate(
    accountId,
    { passwordHash },
    { returnDocument: "after", runValidators: true },
  );
};

const updateAccountStatus = async (accountId, status) => {
  return Account.findByIdAndUpdate(
    accountId,
    { status },
    { returnDocument: "after", runValidators: true },
  );
};

const updateAccountEmail = async (accountId, email) => {
  return Account.findByIdAndUpdate(
    accountId,
    { email: normalizeEmail(email) },
    { returnDocument: "after", runValidators: true },
  );
};

module.exports = {
  createAccount,
  deleteAccountByEmail,
  findAccountByEmail,
  findAccountById,
  updatePasswordHash,
  updateAccountStatus,
  updateAccountEmail,
};

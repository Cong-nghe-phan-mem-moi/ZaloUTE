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

const updateAccountFields = async (accountId, updateData) => {
  return Account.findByIdAndUpdate(accountId, updateData, {
    returnDocument: "after",
    runValidators: true,
  });
};

const addLoginSession = async (accountId, session) => {
  return Account.findByIdAndUpdate(
    accountId,
    { $push: { loginSessions: session } },
    { returnDocument: "after", runValidators: true },
  );
};

const touchLoginSession = async (accountId, sessionId) => {
  return Account.updateOne(
    {
      _id: accountId,
      "loginSessions.sessionId": sessionId,
      "loginSessions.revokedAt": null,
    },
    { $set: { "loginSessions.$.lastActiveAt": new Date() } },
  );
};

const revokeLoginSession = async (accountId, sessionId) => {
  return Account.updateOne(
    {
      _id: accountId,
      "loginSessions.sessionId": sessionId,
      "loginSessions.revokedAt": null,
    },
    { $set: { "loginSessions.$.revokedAt": new Date() } },
  );
};

const revokeOtherLoginSessions = async (accountId, currentSessionId) => {
  return Account.updateOne(
    { _id: accountId },
    {
      $set: {
        "loginSessions.$[session].revokedAt": new Date(),
      },
    },
    {
      arrayFilters: [
        {
          "session.sessionId": { $ne: currentSessionId },
          "session.revokedAt": null,
        },
      ],
      runValidators: true,
    },
  );
};

const revokeAllLoginSessions = async (accountId) => {
  return Account.updateOne(
    { _id: accountId },
    {
      $set: {
        "loginSessions.$[session].revokedAt": new Date(),
      },
    },
    {
      arrayFilters: [{ "session.revokedAt": null }],
      runValidators: true,
    },
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
  updateAccountFields,
  addLoginSession,
  touchLoginSession,
  revokeLoginSession,
  revokeOtherLoginSessions,
  revokeAllLoginSessions,
};

const Account = require('../models/Account');

class AuthRepository {
  async findAccountByEmail(email) {
    return Account.findOne({ email: email.toLowerCase() });
  }

  async findAccountById(accountId) {
    return Account.findById(accountId);
  }

  async updateResetOtp(accountId, resetOtp) {
    return Account.findByIdAndUpdate(
      accountId,
      { resetOtp },
      { returnDocument: 'after' },
    );
  }

  async clearResetOtp(accountId) {
    return Account.findByIdAndUpdate(
      accountId,
      { resetOtp: null },
      { returnDocument: 'after' },
    );
  }

  async updatePasswordHash(accountId, passwordHash) {
    return Account.findByIdAndUpdate(
      accountId,
      { passwordHash },
      { returnDocument: 'after' },
    );
  }
}

module.exports = new AuthRepository();

const jwt = require('jsonwebtoken');
const Account = require('../models/account.model');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.accountId) {
      const account = await Account.findById(decoded.accountId).select(
        'status suspendedUntil suspensionReason loginSessions',
      );

      if (!account) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_ACCOUNT',
          message: 'Account not found',
        });
      }

      if (
        account.status === 'suspended' &&
        account.suspendedUntil &&
        new Date(account.suspendedUntil).getTime() <= Date.now()
      ) {
        account.status = 'active';
        account.suspendedUntil = null;
        account.suspensionReason = '';
        await account.save();
      }

      if (account.status !== 'active') {
        return res.status(403).json({
          success: false,
          code: account.status === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_NOT_ACTIVE',
          message:
            account.status === 'suspended' && account.suspendedUntil
              ? `Account is suspended until ${new Date(account.suspendedUntil).toLocaleString()}`
              : 'Account is not active',
        });
      }

      if (decoded.sessionId) {
        const session = (account.loginSessions || []).find(
          (item) => item.sessionId === decoded.sessionId,
        );

        if (!session || session.revokedAt) {
          return res.status(401).json({
            success: false,
            code: 'SESSION_REVOKED',
            message: 'Login session has ended',
          });
        }

        session.lastActiveAt = new Date();
        await account.save();
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

const resetPasswordSessionMiddleware = (req, res, next) => {
  const resetSession = req.session?.allowResetPassword;

  if (resetSession && resetSession.expiresAt > Date.now()) {
    req.resetPasswordEmail = resetSession.email;
    next();
    return;
  }

  const bearerToken = req.headers.authorization?.split(' ')[1];
  const resetToken = req.body?.resetToken || bearerToken;

  if (resetToken) {
    try {
      const payload = jwt.verify(resetToken, process.env.JWT_SECRET);

      if (payload?.type === 'reset_password' && payload.email) {
        req.resetPasswordEmail = payload.email;
        next();
        return;
      }
    } catch (error) {
      // fall through to unauthorized response
    }
  }

  if (req.session?.allowResetPassword) {
    delete req.session.allowResetPassword;
  }

  return res.status(401).json({
    success: false,
    code: 'RESET_SESSION_EXPIRED',
    message: 'Reset password session has expired. Please verify OTP again.',
    redirectUrl: '/forgot-password',
  });
};

module.exports = {
  authMiddleware,
  authorize,
  resetPasswordSessionMiddleware,
};

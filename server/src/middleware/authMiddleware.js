const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
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

const rateLimit = require("express-rate-limit");

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 register requests per windowMs
  message: "Too many register requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many register requests, please try again later",
    });
  },
});

const editProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs (increased for testing)
  message: "Too many edit profile requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many edit profile requests, please try again later",
    });
  },
});

module.exports = { registerLimiter, editProfileLimiter };

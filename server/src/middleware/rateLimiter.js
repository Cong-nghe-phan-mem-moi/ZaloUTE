const rateLimit = require("express-rate-limit");

// Rate limiting: 5 requests per 15 minutes per IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Quá nhiều yêu cầu đăng ký từ IP này, vui lòng thử lại sau 15 phút",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  registerLimiter,
};

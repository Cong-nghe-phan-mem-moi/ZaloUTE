const Joi = require("joi");

const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50).required().messages({
      "string.empty": "Họ tên không được rỗng",
      "string.min": "Họ tên phải có ít nhất 2 ký tự",
      "any.required": "Họ tên là bắt buộc",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email không đúng định dạng",
      "string.empty": "Email không được rỗng",
      "any.required": "Email là bắt buộc",
    }),
    password: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      )
      .required()
      .messages({
        "string.pattern.base":
          "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
        "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
        "string.empty": "Mật khẩu không được rỗng",
        "any.required": "Mật khẩu là bắt buộc",
      }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;
  next();
};

const validateVerifyOTP = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không đúng định dạng",
      "string.empty": "Email không được rỗng",
      "any.required": "Email là bắt buộc",
    }),
    otp: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        "string.length": "OTP phải có 6 ký tự",
        "string.pattern.base": "OTP phải là số",
        "string.empty": "OTP không được rỗng",
        "any.required": "OTP là bắt buộc",
      }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;
  next();
};

const validateForgotPasswordRequest = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không đúng định dạng",
      "string.empty": "Email không được rỗng",
      "any.required": "Email là bắt buộc",
    }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;
  next();
};

const validateForgotPasswordVerifyOTP = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không đúng định dạng",
      "string.empty": "Email không được rỗng",
      "any.required": "Email là bắt buộc",
    }),
    otp: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        "string.length": "OTP phải có 6 ký tự",
        "string.pattern.base": "OTP phải là số",
        "string.empty": "OTP không được rỗng",
        "any.required": "OTP là bắt buộc",
      }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;
  next();
};

const validateResetPassword = (req, res, next) => {
  const schema = Joi.object({
    newPassword: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      )
      .required()
      .messages({
        "string.pattern.base":
          "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt",
        "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
        "string.empty": "Mật khẩu không được rỗng",
        "any.required": "Mật khẩu là bắt buộc",
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      "any.only": "Xác nhận mật khẩu không khớp",
      "string.empty": "Xác nhận mật khẩu không được rỗng",
      "any.required": "Xác nhận mật khẩu là bắt buộc",
    }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateRegister,
  validateVerifyOTP,
  validateForgotPasswordRequest,
  validateForgotPasswordVerifyOTP,
  validateResetPassword,
};

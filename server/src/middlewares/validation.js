const Joi = require("joi");

const emailMessages = {
  "string.email": "Email format is invalid",
  "string.empty": "Email is required",
  "any.required": "Email is required",
};

const otpMessages = {
  "string.length": "OTP must be 6 characters",
  "string.pattern.base": "OTP must contain digits only",
  "string.empty": "OTP is required",
};

const passwordMessages = {
  "string.pattern.base":
    "Password must include uppercase, lowercase, number, and special character",
  "string.min": "Password must be at least 8 characters",
  "string.empty": "Password is required",
  "any.required": "Password is required",
};

const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(50).required().messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters",
      "any.required": "Full name is required",
    }),
    email: Joi.string().email().required().messages(emailMessages),
    password: Joi.string()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      )
      .required()
      .messages(passwordMessages),
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
  const otpSchema = Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .messages(otpMessages);

  const schema = Joi.object({
    email: Joi.string().email().required().messages(emailMessages),
    otp: otpSchema,
    otpCode: otpSchema,
  }).or("otp", "otpCode").messages({
    "object.missing": "OTP is required",
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = {
    ...value,
    otp: value.otp || value.otpCode,
  };
  delete req.body.otpCode;
  next();
};

const validateForgotPasswordRequest = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages(emailMessages),
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
  const otpSchema = Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .messages(otpMessages);

  const schema = Joi.object({
    email: Joi.string().email().required().messages(emailMessages),
    otp: otpSchema,
    otpCode: otpSchema,
  }).or("otp", "otpCode").messages({
    "object.missing": "OTP is required",
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = {
    ...value,
    otp: value.otp || value.otpCode,
  };
  delete req.body.otpCode;
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
      .messages(passwordMessages),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).optional().messages({
      "any.only": "Password confirmation does not match",
      "string.empty": "Password confirmation is required",
    }),
    resetToken: Joi.string().optional(),
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

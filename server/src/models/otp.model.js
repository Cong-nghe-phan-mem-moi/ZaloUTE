const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['verify_email', 'reset_password'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

otpSchema.index({ email: 1, type: 1, isUsed: 1, createdAt: -1 });

module.exports = mongoose.model('Otp', otpSchema);

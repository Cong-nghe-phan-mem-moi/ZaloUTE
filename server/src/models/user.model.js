const mongoose = require('mongoose');
const { removeVietnameseTones } = require("../utils/stringUtil");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100
  },
  searchName: {
    type: String,
    lowercase: true,
    select: false
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Số điện thoại không hợp lệ']
  },
  avatar: {
    type: String,
    default: null
  },

  bio: {
    type: String,
    maxlength: 500
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String,
    maxlength: 100
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


userSchema.pre("save", async function () {
  if (this.isModified("fullName")) {
    this.searchName = removeVietnameseTones(this.fullName);
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  
  if (update.$set && update.$set.fullName) {
    update.$set.searchName = removeVietnameseTones(update.$set.fullName);
  }
  else if (update.fullName) {
    update.searchName = removeVietnameseTones(update.fullName);
  }

  this.setUpdate(update);
});

module.exports = mongoose.model('User', userSchema);

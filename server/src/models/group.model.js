const mongoose = require('mongoose');
const User = require('./user.model');
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên nhóm không được để trống'],
    trim: true,
    maxLength: [100, 'Tên nhóm không được vượt quá 100 ký tự']
  },
  avatar: {
    type: String,
    default: 'https://cdn-icons-png.flaticon.com/512/166/166258.png' 
  },
  description: {
    type: String,
    trim: true,
    maxLength: [200, 'Mô tả nhóm không được vượt quá 200 ký tự']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  pendingInvites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

groupSchema.index({ name: 'text' }); 

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
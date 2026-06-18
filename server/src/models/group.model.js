const mongoose = require('mongoose');
const { removeVietnameseTones } = require("../utils/stringUtil");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên nhóm không được để trống'],
    trim: true,
    maxLength: [100, 'Tên nhóm không được vượt quá 100 ký tự']
  },
  searchName: {
    type: String,
    lowercase: true,
    select: false
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

groupSchema.index({ searchName: 1 });

groupSchema.pre("save", async function() {
  if (this.isModified('name')) {
    this.searchName = removeVietnameseTones(this.name);
  }
})

groupSchema.pre("findOneAndUpdate", async function() {
  const update = this.getUpdate();

  if (update.$set && update.$set.name) {
    update.$set.searchName = removeVietnameseTones(update.$set.name);
  } else if (update.name) {
    update.searchName = removeVietnameseTones(update.name);
  }

});


const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
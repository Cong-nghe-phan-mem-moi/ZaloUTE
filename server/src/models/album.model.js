const mongoose = require('mongoose');

const albumMediaSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    mediaIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  { _id: false },
);

const albumSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    privacy: {
      type: String,
      enum: ['inherit', 'public', 'friends', 'only_me'],
      default: 'inherit',
    },
    coverUrl: {
      type: String,
      default: '',
    },
    mediaItems: [albumMediaSchema],
  },
  { timestamps: true },
);

albumSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Album', albumSchema);

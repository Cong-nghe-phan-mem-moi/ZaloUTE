const mongoose = require('mongoose');
const { mediaSchema } = require('./media.model');

const STORY_REACTIONS = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    required: true,
  },
  text: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  background: {
    type: String,
    default: '#1877f2',
  },
  media: {
    type: mediaSchema,
    default: null,
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: STORY_REACTIONS,
      default: 'like',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  Story: mongoose.model('Story', storySchema),
  STORY_REACTIONS,
};

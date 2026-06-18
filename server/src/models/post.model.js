const mongoose = require('mongoose');
const { mediaSchema } = require('./media.model'); // Import media sub-document

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    media: [mediaSchema], // Nhúng sub-document Media vào Post
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
            default: 'like'
        }
    }],
    commentCount: {
        type: Number,
        default: 0
    },
    shareCount: {
        type: Number,
        default: 0
    },
    sharedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    shareCaption: {
        type: String,
        default: ''
    },
    privacy: {
        type: {
            type: String,
            enum: ['public', 'friends', 'only_me', 'custom', 'hide_some'],
            default: 'public',
            index: true
        },
        allowedViewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        hiddenViewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    moderation: {
        hidden: {
            type: Boolean,
            default: false,
            index: true
        },
        hiddenReason: {
            type: String,
            default: ''
        },
        hiddenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        hiddenAt: {
            type: Date,
            default: null
        }
    }
}, { timestamps: true });

postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);

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
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required() {
            return this.messageType !== 'ai';
        },
        default: null
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'sticker', 'system', 'video', 'post_share', 'story_reply', 'ai'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isRevoked: {
        type: Boolean,
        default: false
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    sharedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    sharedStory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        default: null
    },
    reactions: [{
        emoji: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);

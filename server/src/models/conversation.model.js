const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    isGroup: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        // Có thể custom validate: required nếu isGroup là true
    },
    avatar: {
        type: String
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    mutedUntil: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        until: { type: Date }
    }],
    blockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
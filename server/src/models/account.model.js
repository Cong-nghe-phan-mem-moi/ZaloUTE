const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned', 'pending', 'suspended'],
        default: 'pending'
    },
    suspendedUntil: {
        type: Date,
        default: null
    },
    suspensionReason: {
        type: String,
        default: ''
    },
    loginSessions: [{
        sessionId: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            default: ''
        },
        ipAddress: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        revokedAt: {
            type: Date,
            default: null
        }
    }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);




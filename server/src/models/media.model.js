const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'video', 'document'],
        required: true
    },
    size: {
        type: Number // bytes
    },
    thumbnailUrl: {
        type: String
    },
    name: {
        type: String
    }
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = { mediaSchema, Media };
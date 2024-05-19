const mongoose = require('mongoose');

const RollSchema = new mongoose.Schema({
    playerName: {
        type: String,
        required: true,
    },
    rollValue: {
        type: Number,
        required: true,
    },
    totalSum: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Roll', RollSchema);

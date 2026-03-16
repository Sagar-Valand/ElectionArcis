const mongoose = require("mongoose");

const gptSession = mongoose.Schema({
    userId: {
        type: String,
    },
    sessionId: {
        type: String,
    },
    sessionHeader: {
        type: String,
    },
    sessionDate: {
        type: String,
    },
    sessionTime: {
        type: String,
    }
}, { collection: 'gptSession' });

module.exports = mongoose.model("gptSession", gptSession);
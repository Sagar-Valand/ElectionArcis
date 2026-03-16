const mongoose = require("mongoose");

const arcisGPT = mongoose.Schema({
    userId: {
        type: String,
    },
    sessionId: {
        type: String,
    },
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
    videoUrls: {
        type: Array,
    },
    filePath: {
        type: String,
    },
    queryDate: {
        type: String,
    },
    queryTime: {
        type: String,
    }
}, { collection: 'arcisgpt' });

module.exports = mongoose.model("arcisgpt", arcisGPT);
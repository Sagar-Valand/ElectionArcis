const mongoose = require("mongoose");


const alerts = mongoose.Schema({
    deviceSN: {
        type: String,
    },
    timeStamp: {
        type: String,
    },
    email: {
        type: String,
    },
    eventType: {
        type: String,
    },
    savestamp: {
        type: Date,
    }
}, { collection: 'alerts' });

module.exports = mongoose.model("alerts", alerts);

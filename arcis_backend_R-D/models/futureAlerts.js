const mongoose = require("mongoose");

const futureAlerts = mongoose.Schema({
    userId: {
        type: String,
    },
    deviceId: {
        type: String,
    },
    rule_json: {
        type: Object,
    },
    is_active: {
        type: Number,
    }
}, { collection: 'futureAlerts' });

module.exports = mongoose.model("futureAlerts", futureAlerts);
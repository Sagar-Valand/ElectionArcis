const mongoose = require("mongoose");
// const { use } = require("../app");

const plan = mongoose.Schema({
    cameraObjectId: {
        type: String,
        required: [true, "Please Enter Camera Object Id"],
    },
    deviceId: {
        type: String,
        required: [true, "Please Enter Device Id"],
    },
    planName: {
        type: String,
    },
    planDays: {
        type: String,
    },
    storagePlan: {
        type: String,
    },
    planStartDate: {
        type: String,
    },
    planEndDate: {
        type: String,
    },
    planStatus: {
        type: String,
    },
    ai_name: {
        type: Array,
    },
    event: {
        type: Boolean,
        default: true
    },
    userId: {
        type: String,
    }
}, { collection: 'plan' });

module.exports = mongoose.model("plan", plan);

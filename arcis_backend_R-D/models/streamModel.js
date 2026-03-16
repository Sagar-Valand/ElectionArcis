const mongoose = require("mongoose");


const stream = mongoose.Schema({
    cameraObjectId: {
        type: String,
        required: [true, "Please Enter Camera Object Id"],
    },
    deviceId: {
        type: String,
        required: [true, "Please Enter User Id"],
    },
    mediaUrl: {
        type: String,
    },
    p2purl: {
        type: String,
        default: "torqueverse.dev"
    },
    token: {
        type: String,
        default: "a/b4Znt+OFGrYtmHw0T16Q==",
    },
    plan: {
        type: String,
    },
    streamTokens: {
        type: Array,
    },
    quality: {
        type: String,
    },
    smartQuality: {
        type: Boolean,
    },
    dataPlan: {
        type: Number
    },
    is_live: {
        type: Boolean,
        required: true
    },
    status: {
        type: Boolean,
        required: true,
        default: false
    },

    last_checked: {
        type: Date,
        default: Date.now
    }


}, { collection: 'stream' });

module.exports = mongoose.model("stream", stream);

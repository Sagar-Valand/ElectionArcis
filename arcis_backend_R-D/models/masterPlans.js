const mongoose = require("mongoose");

const masterPlan = mongoose.Schema({
    name: {
        type: String,
    },
    monthly: {
        type: String,
    },
    annually: {
        type: String,
    },
    icon: {
        type: String,
    },
    features: {
        type: Array,
    },
    aiFeatures: {
        type: Array,
    },
    color: {
        type: String,
    }
}, { collection: 'masterPlan' });

module.exports = mongoose.model("masterPlan", masterPlan);
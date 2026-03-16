const mongoose = require("mongoose");

const analyticsImageSchema = new mongoose.Schema({
    cameradid: { type: String, required: true },
    sendtime: { type: Date, required: true },
    imgurl: { type: String, required: true },
    an_id: { type: Number, required: true },
    ImgCount: { type: Number, required: true },
    numberplateid: { type: String }, // Add this line
    person_name: { type: String }, // Add this line
    male_count: { type: Number },
    female_count: { type: Number }
});

// Export the model with the corrected name
module.exports = mongoose.model("AnalyticsImage", analyticsImageSchema);
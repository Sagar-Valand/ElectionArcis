const mongoose = require('mongoose');

// Define the schema for AI settings
const AiSettingSchema = new mongoose.Schema({
    // The deviceId is the unique identifier for the camera.
    // It should be required and unique to ensure we don't have duplicate settings.
    deviceId: {
        type: String,
        required: [true, "Device ID is required"],
        unique: true,
        trim: true
    },
       screenshot: {
        type: String,
        default: null
    },
    object_detection: {
        type: Boolean,
        default: false
    },
    
    // People & Crowd Analytics
    face_recognition: {
        type: Boolean,
        default: false
    },
    idle_time_detection: {
        type: Boolean,
        default: false
    },
    line_crossing_detection: {
        type: Boolean,
        default: false
    },
    person_count_detection: {
        type: Boolean,
        default: false
    },
    // Safety & Risk Detection
    fire_smoke_detection_custom: {
        type: Boolean,
        default: false
    },
    ppe_detection: {
        type: Boolean,
        default: false
    },
    medical_ppe_detection: {
        type: Boolean,
        default: false
    },
    // Driver Monitoring System (DMS)
    mobile_detection: {
        type: Boolean,
        default: false
    },
    // Election-Specific AI
    evm_detection: {
        type: Boolean,
        default: false
    }
}, {
    // Add timestamps (createdAt, updatedAt) automatically
    timestamps: true 
});

// Create and export the Mongoose model
const AiSetting = mongoose.model('AiSetting', AiSettingSchema);

module.exports = AiSetting;
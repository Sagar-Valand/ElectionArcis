const mongoose = require('mongoose');

// This schema is specifically for storing coordinate data for various AI modules.
const aiCoordinatesSchema = new mongoose.Schema({
    // This is the link back to the main settings and the camera itself. It should be unique.
    deviceId: {
        type: String,
        required: true,
        unique: true,
        index: true // Index for fast lookups
    },
      screenshot: {
        type: String,
        default: null
    },
    // Each field here corresponds to a specific module's parameters.
    // We are storing the raw JSON/Object data directly.
    line_crossing_detection_params: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    idle_time_detection_params: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    ppe_detection_params: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
    // Add other _params fields here as you create more AI modules that need them.
}, {
    timestamps: true // Automatically adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('AiCoordinates', aiCoordinatesSchema);
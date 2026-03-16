const mongoose = require('mongoose');

const camerastopdurationSchema = new mongoose.Schema({
    name: { // This is the camera ID, e.g., "RTSP-VSPL-121348-TCRGP"
        type: String,
        required: true,
        trim: true
    },
    last_start_time: {
        type: String,
        required: true
    },
    last_close_time: {
        type: String,
        required: true
    },
    diff: {
        type: String, // Stored as "HH:MM"
    }
}, {
    // This option tells Mongoose to use the exact collection name
    // By default, it would look for "camerastopdurations" (plural)
    collection: 'Camerastopduration', 
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Camerastopduration', camerastopdurationSchema);

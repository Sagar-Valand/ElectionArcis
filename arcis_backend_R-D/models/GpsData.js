const mongoose = require('mongoose');

const gpsDataSchema = new mongoose.Schema({
    deviceId: String,
    name: String,
    deviceImei: String,
    status: String,
    lastUpdate: String,
    posId: String,
    phone: String,
    type: String,
    latitude: String,
    longitude: String,
    deviceFixTime: String, // Assuming format like "2023-10-25T14:30:00" or "2023-10-25 14:30:00"
    speed: String,
    course: String,
    ignition: String,
    totalDistance: String,
    alarm: String
});

module.exports = mongoose.model('gpsdata', gpsDataSchema);

const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: false
    },
    email: { 
    type: String,
    required: true
  },
    active: {
        type: Number, 
        default: 0
    },
    ipaddress: {
        type: String
    },
    loginTime: {
        type: Date
    },
    logoutTime: {
        type: Date
    }
});

module.exports = mongoose.model('UserActivity', userActivitySchema);
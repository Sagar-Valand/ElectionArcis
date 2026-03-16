const mongoose = require('mongoose');

// Define the schema
const dataSchema = new mongoose.Schema({
  sendtime: {
    type: String,
    required: true
  },
  imgurl: {
    type: String,
    required: true
  },
  modelname: {
    type: String,
    required: true
  },
  ImgCount: {
    type: Number,
  },
  userId: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  dvr_plan: {
    type: String,
    required: true
  }
});

// Create a model from the schema
const Data = mongoose.model('aiEvent', dataSchema);

module.exports = Data;

const mongoose = require("mongoose");

const camera = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please Enter Email"],
    },
    userId: {
      type: String,
      required: [true, "Please Enter User Id"],
    },
    deviceId: {
      type: String,
      required: [true, "Please Enter camera Id"],
    },
    name: {
      type: String,
      required: [true, "Please Enter Camera Name"],
    },
    created_date: {
      type: String,
      required: true,
    },
    isp2p: {
      type: Number,
      default: 1,
    },
    productType: {
      type: String,
      required: true,
    },
    lastImage: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    connectedOnceFlag: { type: Boolean, default: false },

    sharedWith: [
      {
        email: {
          type: String,
          required: true,
        },
        userId: {
          type: String,
          required: true,
        },
      },
    ],
    ps_id: {
      type: String,
      required: true,
    },
    locations: [String],
    did: {
      type: String,
      ref: "district"
    },
    camera:{
      type: String,
      required: true
    },
    location_Type:{
      type: String,
      required: true
    },
     latitude:{
      type: String,
      required: true
    },
    
longitude:{
      type: String,
      required: true
    },
    
operatorId:{
      type: String,
      required: true
    },
    districtAssemblyCode: { type: String },
  },
  
  { collection: "camera" } 
);

module.exports = mongoose.model("camera", camera);

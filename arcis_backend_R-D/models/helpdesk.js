const mongoose = require("mongoose");

const helpdeskSchema = new mongoose.Schema(
  {
    agentName: {
      type: String,
      required: [false, "Please Enter agent name"],
    },
    dist_name: {
      type: String,
      required: [true, "Please Enter district"],
    },
    accName: {
      type: String,
      required: [true, "Please Enter assembly"],
    },
    vehicleNo: {
      type: String,
      required: [true, "Please Enter vehicle no"],
    },
    cameraId: {
      type: String,
      required: [true, "Please Enter Camera Id"],
    },
    activity: {
      type: String,
      required: [true, "Please Enter activity"],
    },
    districtAssemblyCode: { type: String },
    dateTime: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "helpdesk" }
);

module.exports = mongoose.model("Helpdesk", helpdeskSchema);

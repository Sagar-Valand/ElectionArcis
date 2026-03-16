const mongoose = require("mongoose");

const incidentReportSchema = new mongoose.Schema(
  {
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
    incidentDetails: {
      type: String,
      required: [true, "Please Enter incidence details"],
    },
    driverName: {
      type: String,
      required: [false, "Please Enter driver name"],
    },
    driverContact: {
      type: String, 
      required: [false, "Please Enter driver contact number"],
    },
    cameraId: {
      type: String,
      required: [true, "Please Enter Camera/Stream ID"],
    },
    incidentDateTime: {
      type: Date,
      required: [true, "Please Enter date and time of incident"],
    },

    accode: {
      type: String,
      required: [false, "Please enter Assembly Code"],
    },
    districtAssemblyCode: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "incidentReport" }
);

module.exports = mongoose.model("incidentReport", incidentReportSchema);
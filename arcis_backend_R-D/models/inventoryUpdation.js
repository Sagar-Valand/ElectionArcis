const mongoose = require("mongoose");

const inventoryUpadationSchema = new mongoose.Schema(
  {
    dist_name: {
      type: String,
      required: [true, "Please Enter district"],
    },
    accName: {
      type: String,
      required: [true, "Please Enter assembly"],
    },
    cameraId: {
      type: String,
      required: [true, "Please Enter Camera Id"],
    },
    vehicleNo: {
      type: String,
      required: [true, "Please Enter vehicle no"],
    },
    material: {
      type: String,
      required: [true, "Please Enter material name"],
    },
    status: {
      type: String,
      required: [true, "Please Enter status"],
    },
    remarks: {
      type: String,
      required: [false, "Please Enter remarks if any"],
    },
    startDate: {
      type: Date,
      required: [true, "Please Enter start date"],
    },
    endDate: {
      type: Date,
      required: [false, "Please Enter end date"],
    },
    oldSerialNumber: {
      type: String,
      required: [false, "Please Enter old serial number"],
    },
    newSerialNumber: {
      type: String,
      required: [false, "Please Enter new serial number"],
    },

    accode: {
      type: String,
      required: [false, "Please Enter Assembly Code"],
    },
    districtAssemblyCode: { type: String },
    // actionTaken: {
    //   type: String,
    //   enum: ['Repaired', 'Replaced', 'None'],
    //   required: [false, "Specify if Repaired or Replaced"],
    // },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "inventoryUpdation" }
);

module.exports = mongoose.model("inventoryUpdation", inventoryUpadationSchema);
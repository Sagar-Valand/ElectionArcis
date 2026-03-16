const mongoose = require("mongoose");

const districtSchema = mongoose.Schema(
  {
    Srno:{
      type:Number,
      required: true
    },
    dist_name: {
      type: String,
      required: true,
    },
    accode: {
      type: String,
      unique: true
    },
    accName: {
      type: String,
      unique:true
    },
    districtAssemblyCode: {
      type: String,
      required: true,
      // unique: true
    }
  },
  { collection: "district" }
);

module.exports = mongoose.model("district", districtSchema);
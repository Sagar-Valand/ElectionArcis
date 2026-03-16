const mongoose = require("mongoose");

const operatorSchema = mongoose.Schema(
  {
    Srno:{
      type:Number,
      required: true
    },
    
 operatorId:{
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required:true
    },
   
  },
  { collection: "operator_infos" }
);

module.exports = mongoose.model("operator_infos", operatorSchema);

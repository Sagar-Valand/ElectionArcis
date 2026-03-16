const mongoose = require("mongoose");

const orderModelSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    order_id: {
      type: String,
      required: true,
    },
    shippingInfo: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },
      pinCode: {
        type: Number,
        required: true,
      },
      phoneNo: {
        type: Number,
        required: true,
      },
    },
    orderItems: {
      cameraName: {
        type: String,
        // required: true,
      },
      cameraType: {
        type: String,
        // required: true,
      },
      quantity: {
        type: Number,
        // required: true,
      },
      price: {
        type: Number,
        // required: true,
      },
      planName: {
        type: String,
        // required: true,
      },
      featuresList: {
        type: Array,
        // required: true,
      },
      planDays: {
        type: Number,
        // required: true,
      },
      planStartDate: {
        type: String,
        // required: true,
      },
      planEndDate: {
        type: String,
        // required: true,
      },
      deviceId: {
        type: Array,
        // required: true,
      },
      storagePlan: {
        type: String,
      },
    },
  },
  { collection: "orderModel" }
);

module.exports = mongoose.model("orderModel", orderModelSchema);

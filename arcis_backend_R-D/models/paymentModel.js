const mongoose = require("mongoose");
const { type } = require("mquery/lib/env");
// Insert uuidString into MongoDB

const paymentModelSchema = mongoose.Schema({
    userId: {
        type: String,
    },
    amount: {
        type: Number
    },
    amount_due: {
        type: Number
    },
    amount_paid: {
        type: Number
    },
    attempts: {
        type: Number
    },
    created_at: {
        type: Number
    },
    currency: {
        type: String,
    },
    entity: {
        type: String,
    },
    order_id: {
        type: String,
    },
    notes: {
        type: mongoose.Schema.Types.Mixed
    },
    offer_id: {
        type: String,
    },
    signature: {
        type: String,
    },
    payment_id: {
        type: String,
    },
    payment_method: {
        type: String,
    },
    receipt: {
        type: String,
    },
    status: {
        type: String,
    }
}, { collection: 'paymentModel' });

module.exports = mongoose.model("paymentModel", paymentModelSchema);
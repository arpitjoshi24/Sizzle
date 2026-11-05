
const mongoose = require("mongoose");

const orderHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PLACED",
        "PREPARING",
        "READY",
        "SERVED",
        "CANCELLED",
      ],
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Find order history chronologically
orderHistorySchema.index({
  order: 1,
  changedAt: 1,
});

module.exports = mongoose.model(
  "OrderHistory",
  orderHistorySchema
);

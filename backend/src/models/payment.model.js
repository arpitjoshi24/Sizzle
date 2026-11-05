
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    method: {
      type: String,
      enum: ["CASH", "CARD"],
      required: true
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "REFUNDED"],
      default: "SUCCESS"
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    },

    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ order: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);

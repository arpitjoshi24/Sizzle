
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH", "CARD"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      required: true,
    },

    // Razorpay details
    gatewayOrderId: {
      type: String,
      default: null,
    },

    gatewayPaymentId: {
      type: String,
      default: null,
    },

    gatewaySignature: {
      type: String,
      default: null,
      select: false,
    },

    // Offline payment details
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    transactionReference: {
      type: String,
      trim: true,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);

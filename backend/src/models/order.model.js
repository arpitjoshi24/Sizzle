
const mongoose = require("mongoose");
const orderItemSchema = require("./orderItem.model");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    orderSource: {
      type: String,
      enum: ["QR", "WAITER"],
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    customerName: {
      type: String,
      trim: true,
      default: "",
    },

    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },

    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH", "CARD"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      required: true,
    },

    orderStatus: {
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
      default: "PENDING_PAYMENT",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // Kitchen preparation started
    kitchenStartedAt: {
      type: Date,
      default: null,
    },

    // Kitchen completed preparation
    readyAt: {
      type: Date,
      default: null,
    },

    // Waiter served the order
    servedAt: {
      type: Date,
      default: null,
    },

    // Order cancellation
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Staff member who last updated order status
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({
  orderStatus: 1,
  paymentStatus: 1,
});

orderSchema.index({
  table: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Order", orderSchema);

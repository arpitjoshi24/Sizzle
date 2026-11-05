const mongoose = require("mongoose");

const kitchenQueueSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["QUEUED", "PREPARING", "READY", "CANCELLED"],
      default: "QUEUED",
      required: true,
    },

    priority: {
      type: Number,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    readyAt: {
      type: Date,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

kitchenQueueSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("KitchenQueue", kitchenQueueSchema);
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      trim: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    location: {
      type: String,
      default: "Main Hall",
      trim: true
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Table numbers must be unique
tableSchema.index({ tableNumber: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
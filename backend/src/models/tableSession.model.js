
const mongoose = require("mongoose");

const tableSessionSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },

    sessionToken: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED"],
      default: "ACTIVE",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

tableSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TableSession", tableSessionSchema);

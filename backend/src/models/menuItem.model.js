const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    image: {
      type: String,
      default: ""
    },

    foodType: {
      type: String,
      enum: ["VEG", "NON_VEG", "EGG"],
      default: "VEG"
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

menuItemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);
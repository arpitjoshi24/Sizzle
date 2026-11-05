
const mongoose = require("mongoose");

const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");

// Validate MongoDB ObjectId
const validateOrderId = (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }
};

// Get all active kitchen orders
const getKitchenOrders = async () => {
  return await Order.find({
    paymentStatus: "PAID",
    orderStatus: {
      $in: ["PLACED", "PREPARING", "READY"],
    },
  })
    .populate("table", "tableNumber")
    .sort({ createdAt: 1 });
};

// Start preparing an order
const startPreparingOrder = async (orderId, staffId) => {
  validateOrderId(orderId);

  const now = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: "PAID",
      orderStatus: "PLACED",
    },
    {
      $set: {
        orderStatus: "PREPARING",
        kitchenStartedAt: now,
        statusUpdatedBy: staffId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("table", "tableNumber");

  if (!order) {
    const error = new Error(
      "Order not found or order is not in PLACED status"
    );
    error.statusCode = 409;
    throw error;
  }

  await OrderHistory.create({
    order: order._id,
    status: "PREPARING",
    changedBy: staffId,
  });

  return order;
};

// Mark order as ready
const markOrderReady = async (orderId, staffId) => {
  validateOrderId(orderId);

  const now = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: "PAID",
      orderStatus: "PREPARING",
    },
    {
      $set: {
        orderStatus: "READY",
        readyAt: now,
        statusUpdatedBy: staffId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("table", "tableNumber");

  if (!order) {
    const error = new Error(
      "Order not found or order is not in PREPARING status"
    );
    error.statusCode = 409;
    throw error;
  }

  await OrderHistory.create({
    order: order._id,
    status: "READY",
    changedBy: staffId,
  });

  return order;
};

module.exports = {
  getKitchenOrders,
  startPreparingOrder,
  markOrderReady,
};

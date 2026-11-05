const mongoose = require("mongoose");

const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");
const { getIO } = require("../../config/socket");

const getReadyOrders = async () => {
  return Order.find({
    paymentStatus: "PAID",
    orderStatus: "READY",
  })
    .populate("table", "tableNumber")
    .populate("waiter", "name")
    .sort({ readyAt: 1 });
};

const getOrderDetails = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId)
    .populate("table", "tableNumber")
    .populate("waiter", "name")
    .populate("statusUpdatedBy", "name");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

const markOrderServed = async (orderId, staffId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const dbSession = await mongoose.startSession();

  try {
    let updatedOrder;
    let orderForEvent;

    await dbSession.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        paymentStatus: "PAID",
        orderStatus: "READY",
      }).session(dbSession);

      if (!order) {
        const error = new Error(
          "Order not found or order is not READY"
        );
        error.statusCode = 409;
        throw error;
      }

      const now = new Date();

      order.orderStatus = "SERVED";
      order.servedAt = now;
      order.statusUpdatedBy = staffId;

      await order.save({ session: dbSession });

      await OrderHistory.create(
        [
          {
            order: order._id,
            status: "SERVED",
            changedBy: staffId,
            notes: "Order served by waiter",
          },
        ],
        { session: dbSession }
      );

      updatedOrder = order;

      orderForEvent = {
        _id: order._id,
        orderNumber: order.orderNumber,
        table: order.table,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        servedAt: order.servedAt,
        statusUpdatedBy: staffId,
      };
    });

    // Emit after successful transaction commit.
    if (updatedOrder && orderForEvent) {
      const io = getIO();

      io.to("ADMIN").emit("order:served", orderForEvent);
      io.to("WAITER").emit("order:served", orderForEvent);
    }

    return updatedOrder;
  } finally {
    await dbSession.endSession();
  }
};

module.exports = {
  getReadyOrders,
  getOrderDetails,
  markOrderServed,
};
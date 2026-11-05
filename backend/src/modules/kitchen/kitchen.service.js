const mongoose = require("mongoose");

const KitchenQueue = require("../../models/kitchenQueue.model");
const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");
const { getIO } = require("../../config/socket");

const getKitchenQueue = async () => {
  return KitchenQueue.find({
    status: { $in: ["QUEUED", "PREPARING", "READY"] },
  })
    .populate({
      path: "order",
      match: {
        paymentStatus: "PAID",
        orderStatus: { $in: ["PLACED", "PREPARING", "READY"] },
      },
      populate: {
        path: "table",
        select: "tableNumber",
      },
    })
    .populate("assignedTo", "name")
    .sort({ priority: -1, createdAt: 1 });
};

const updateKitchenStatus = async ({ queueId, status, userId }) => {
  if (!mongoose.isValidObjectId(queueId)) {
    const error = new Error("Invalid kitchen queue ID");
    error.statusCode = 400;
    throw error;
  }

  if (!["PREPARING", "READY"].includes(status)) {
    const error = new Error("Status must be PREPARING or READY");
    error.statusCode = 400;
    throw error;
  }

  const dbSession = await mongoose.startSession();

  try {
    let updatedQueue;
    let orderForEvent;

    await dbSession.withTransaction(async () => {
      const queue = await KitchenQueue.findById(queueId).session(dbSession);

      if (!queue) {
        const error = new Error("Kitchen queue entry not found");
        error.statusCode = 404;
        throw error;
      }

      const order = await Order.findById(queue.order).session(dbSession);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (order.paymentStatus !== "PAID") {
        const error = new Error(
          "Unpaid orders cannot be processed by kitchen"
        );
        error.statusCode = 400;
        throw error;
      }

      if (status === "PREPARING") {
        if (queue.status !== "QUEUED" || order.orderStatus !== "PLACED") {
          const error = new Error("Only queued orders can be started");
          error.statusCode = 409;
          throw error;
        }

        queue.status = "PREPARING";
        queue.startedAt = new Date();
        queue.assignedTo = userId;

        order.orderStatus = "PREPARING";
        order.kitchenStartedAt = new Date();
      }

      if (status === "READY") {
        if (
          queue.status !== "PREPARING" ||
          order.orderStatus !== "PREPARING"
        ) {
          const error = new Error(
            "Only preparing orders can be marked ready"
          );
          error.statusCode = 409;
          throw error;
        }

        queue.status = "READY";
        queue.readyAt = new Date();
        queue.assignedTo = userId;

        order.orderStatus = "READY";
        order.readyAt = new Date();
      }

      order.statusUpdatedBy = userId;

      await queue.save({ session: dbSession });
      await order.save({ session: dbSession });

      await OrderHistory.create(
        [
          {
            order: order._id,
            status: order.orderStatus,
            changedBy: userId,
            notes: `Kitchen updated order status to ${order.orderStatus}`,
          },
        ],
        { session: dbSession }
      );

      updatedQueue = queue;

      orderForEvent = {
        _id: order._id,
        orderNumber: order.orderNumber,
        table: order.table,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        items: order.items,
        kitchenStartedAt: order.kitchenStartedAt,
        readyAt: order.readyAt,
      };
    });

    // Emit only after the database transaction commits.
    if (updatedQueue && orderForEvent) {
      const io = getIO();
      const eventName =
        status === "PREPARING" ? "order:preparing" : "order:ready";

      io.to("ADMIN").emit(eventName, orderForEvent);
      io.to("WAITER").emit(eventName, orderForEvent);
      io.to("KITCHEN").emit(eventName, orderForEvent);
    }

    return updatedQueue;
  } finally {
    await dbSession.endSession();
  }
};

module.exports = {
  getKitchenQueue,
  updateKitchenStatus,
};
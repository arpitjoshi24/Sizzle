
const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");

const getReadyOrders = async () => {
  return await Order.find({
    paymentStatus: "PAID",
    orderStatus: "READY",
  })
    .populate("table", "tableNumber")
    .sort({ readyAt: 1 });
};

const markOrderServed = async (orderId, staffId) => {
  const now = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: "PAID",
      orderStatus: "READY",
    },
    {
      $set: {
        orderStatus: "SERVED",
        servedAt: now,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    const error = new Error(
      "Order not found or order is not READY"
    );
    error.statusCode = 409;
    throw error;
  }

  await OrderHistory.create({
    order: order._id,
    status: "SERVED",
    changedBy: staffId,
  });

  return order;
};

module.exports = {
  getReadyOrders,
  markOrderServed,
};

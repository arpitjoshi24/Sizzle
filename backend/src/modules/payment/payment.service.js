const crypto = require("crypto");

const Payment = require("../../models/payment.model");
const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");
const KitchenQueue = require("../../models/kitchenQueue.model");
const { getIO } = require("../../config/socket");

const recordPayment = async ({ orderId, method, receivedBy, notes }) => {
  const dbSession = await Order.startSession();

  try {
    let paymentResult;
    let orderForEvent;

    await dbSession.withTransaction(async () => {
      if (!["CASH", "CARD"].includes(method)) {
        const error = new Error("Payment method must be CASH or CARD");
        error.statusCode = 400;
        throw error;
      }

      const order = await Order.findById(orderId).session(dbSession);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (order.paymentStatus === "PAID") {
        const error = new Error("Order is already paid");
        error.statusCode = 409;
        throw error;
      }

      if (order.orderStatus !== "PENDING_PAYMENT") {
        const error = new Error("Order is not awaiting payment");
        error.statusCode = 400;
        throw error;
      }

      const paymentNumber = `PAY-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      const [payment] = await Payment.create(
        [
          {
            paymentNumber,
            order: order._id,
            amount: order.totalAmount,
            method,
            status: "SUCCESS",
            receivedBy,
            notes: notes || "",
            paidAt: new Date(),
          },
        ],
        { session: dbSession }
      );

      order.paymentMethod = method;
      order.paymentStatus = "PAID";
      order.orderStatus = "PLACED";

      await order.save({ session: dbSession });

      await KitchenQueue.findOneAndUpdate(
        { order: order._id },
        {
          $setOnInsert: {
            order: order._id,
            status: "QUEUED",
            priority: 0,
          },
        },
        {
          upsert: true,
          new: true,
          session: dbSession,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      await OrderHistory.create(
        [
          {
            order: order._id,
            status: "PLACED",
            changedBy: receivedBy,
            notes: `Payment received by ${method}; order added to kitchen queue`,
          },
        ],
        { session: dbSession }
      );

      paymentResult = payment;

      orderForEvent = {
        _id: order._id,
        orderNumber: order.orderNumber,
        table: order.table,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt,
      };
    });

    // Emit only after the database transaction commits.
    if (paymentResult && orderForEvent) {
      const io = getIO();

      io.to("KITCHEN").emit("order:new", orderForEvent);
      io.to("ADMIN").emit("order:new", orderForEvent);

      io.to("ADMIN").emit("payment:success", {
        paymentId: paymentResult._id,
        paymentNumber: paymentResult.paymentNumber,
        orderId: orderForEvent._id,
        orderNumber: orderForEvent.orderNumber,
        amount: paymentResult.amount,
        method: paymentResult.method,
        status: paymentResult.status,
        paidAt: paymentResult.paidAt,
      });

      io.to("WAITER").emit("payment:success", {
        paymentId: paymentResult._id,
        orderId: orderForEvent._id,
        orderNumber: orderForEvent.orderNumber,
        amount: paymentResult.amount,
        method: paymentResult.method,
        status: paymentResult.status,
      });
    }

    return paymentResult;
  } finally {
    await dbSession.endSession();
  }
};

const getAllPayments = async ({ method, status } = {}) => {
  const filter = {};

  if (method) filter.method = method;
  if (status) filter.status = status;

  return Payment.find(filter)
    .populate("order", "orderNumber totalAmount orderStatus")
    .populate("receivedBy", "name email")
    .sort({ createdAt: -1 });
};

const getPaymentById = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate("order", "orderNumber totalAmount orderStatus")
    .populate("receivedBy", "name email");

  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

module.exports = {
  recordPayment,
  getAllPayments,
  getPaymentById,
};
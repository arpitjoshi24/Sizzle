
const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const Order = require("../../models/order.model");
const Payment = require("../../models/payment.model");
const OrderHistory = require("../../models/orderHistory.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Validate MongoDB ID
const validateId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }
};

// Create Razorpay payment order
const createRazorpayOrder = async (orderId) => {
  validateId(orderId);

  const order = await Order.findOne({
    _id: orderId,
    orderSource: "QR",
    paymentMethod: "ONLINE",
    paymentStatus: "PENDING",
    orderStatus: "PENDING_PAYMENT",
  });

  if (!order) {
    const error = new Error(
      "Order not found or payment is not pending"
    );
    error.statusCode = 404;
    throw error;
  }

  // Amount must be sent in paise
  const amountInPaise = Math.round(order.totalAmount * 100);

  if (amountInPaise <= 0) {
    const error = new Error("Invalid payment amount");
    error.statusCode = 400;
    throw error;
  }

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: order.orderNumber,
  });

  // Save payment record
  const payment = await Payment.create({
    order: order._id,
    paymentMethod: "ONLINE",
    amount: order.totalAmount,
    paymentStatus: "PENDING",
    gatewayOrderId: razorpayOrder.id,
  });

  return {
    paymentId: payment._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

// Verify Razorpay payment
const verifyRazorpayPayment = async ({
  orderId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  validateId(orderId);

  const order = await Order.findOne({
    _id: orderId,
    orderSource: "QR",
    paymentMethod: "ONLINE",
    paymentStatus: "PENDING",
    orderStatus: "PENDING_PAYMENT",
  });

  if (!order) {
    const error = new Error(
      "Order not found or already processed"
    );
    error.statusCode = 409;
    throw error;
  }

  // Find matching payment record
  const payment = await Payment.findOne({
    order: order._id,
    gatewayOrderId: razorpay_order_id,
    paymentStatus: "PENDING",
  });

  if (!payment) {
    const error = new Error("Payment record not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify signature using Razorpay secret
  const body =
    `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(body)
    .digest("hex");

  const received = Buffer.from(razorpay_signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    const error = new Error("Invalid payment signature");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // Atomically change order status
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
    },
    {
      $set: {
        paymentStatus: "PAID",
        orderStatus: "PLACED",
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedOrder) {
    const error = new Error(
      "Order payment has already been processed"
    );
    error.statusCode = 409;
    throw error;
  }

  // Update payment record
  await Payment.findByIdAndUpdate(payment._id, {
    $set: {
      paymentStatus: "PAID",
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      paidAt: now,
    },
  });

  // Save order history
  await OrderHistory.create({
    order: updatedOrder._id,
    status: "PLACED",
    changedBy: null,
    notes: "Online payment successfully verified",
    changedAt: now,
  });

  return updatedOrder;
};

// Record waiter cash/card payment
const recordOfflinePayment = async ({
  orderId,
  paymentMethod,
  transactionReference,
  staffId,
}) => {
  validateId(orderId);

  if (!["CASH", "CARD"].includes(paymentMethod)) {
    const error = new Error(
      "Payment method must be CASH or CARD"
    );
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findOne({
    _id: orderId,
    orderSource: "WAITER",
    paymentStatus: "PENDING",
    orderStatus: "PENDING_PAYMENT",
  });

  if (!order) {
    const error = new Error(
      "Order not found or payment already processed"
    );
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();

  // Atomically update order
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
    },
    {
      $set: {
        paymentMethod,
        paymentStatus: "PAID",
        orderStatus: "PLACED",
        statusUpdatedBy: staffId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedOrder) {
    const error = new Error(
      "Payment has already been recorded"
    );
    error.statusCode = 409;
    throw error;
  }

  // Create offline payment record
  await Payment.create({
    order: updatedOrder._id,
    paymentMethod,
    amount: updatedOrder.totalAmount,
    paymentStatus: "PAID",
    receivedBy: staffId,
    transactionReference: transactionReference || "",
    paidAt: now,
  });

  // Record order history
  await OrderHistory.create({
    order: updatedOrder._id,
    status: "PLACED",
    changedBy: staffId,
    notes: `${paymentMethod} payment received by waiter`,
    changedAt: now,
  });

  return updatedOrder;
};

// Get payments for an order
const getOrderPayments = async (orderId) => {
  validateId(orderId);

  return await Payment.find({
    order: orderId,
  })
    .populate("receivedBy", "name")
    .sort({ createdAt: -1 });
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordOfflinePayment,
  getOrderPayments,
};

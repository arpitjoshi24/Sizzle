
const mongoose = require("mongoose");
const Payment = require("../../models/payment.model");

const getAllPayments = async (query) => {
  const {
    paymentMethod,
    paymentStatus,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = query;

  const filter = {};

  if (paymentMethod) {
    if (!["CASH", "CARD"].includes(paymentMethod)) {
      const error = new Error("Invalid payment method");
      error.statusCode = 400;
      throw error;
    }
    filter.paymentMethod = paymentMethod;
  }

  if (paymentStatus) {
    if (!["PAID", "REFUNDED"].includes(paymentStatus)) {
      const error = new Error("Invalid payment status");
      error.statusCode = 400;
      throw error;
    }
    filter.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    filter.paidAt = {};

    if (startDate) {
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) {
        const error = new Error("Invalid startDate");
        error.statusCode = 400;
        throw error;
      }
      filter.paidAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (Number.isNaN(end.getTime())) {
        const error = new Error("Invalid endDate");
        error.statusCode = 400;
        throw error;
      }
      end.setHours(23, 59, 59, 999);
      filter.paidAt.$lte = end;
    }
  }

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (currentPage - 1) * pageLimit;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: "order",
        select: "orderNumber table orderSource totalAmount orderStatus",
        populate: {
          path: "table",
          select: "tableNumber",
        },
      })
      .populate("receivedBy", "name email role")
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(pageLimit),

    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    },
  };
};

const getPaymentSummary = async (query) => {
  const { startDate, endDate } = query;
  const match = {};

  if (startDate || endDate) {
    match.paidAt = {};

    if (startDate) {
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) {
        const error = new Error("Invalid startDate");
        error.statusCode = 400;
        throw error;
      }
      match.paidAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (Number.isNaN(end.getTime())) {
        const error = new Error("Invalid endDate");
        error.statusCode = 400;
        throw error;
      }
      end.setHours(23, 59, 59, 999);
      match.paidAt.$lte = end;
    }
  }

  const summary = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          paymentMethod: "$paymentMethod",
          paymentStatus: "$paymentStatus",
        },
        totalAmount: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalCollected: 0,
    cashCollected: 0,
    cardCollected: 0,
    refundedAmount: 0,
    totalPayments: 0,
    cashPayments: 0,
    cardPayments: 0,
  };

  for (const item of summary) {
    const amount = item.totalAmount;
    const count = item.paymentCount;

    if (item._id.paymentStatus === "REFUNDED") {
      result.refundedAmount += amount;
      continue;
    }

    if (item._id.paymentStatus === "PAID") {
      result.totalCollected += amount;
      result.totalPayments += count;

      if (item._id.paymentMethod === "CASH") {
        result.cashCollected += amount;
        result.cashPayments += count;
      }

      if (item._id.paymentMethod === "CARD") {
        result.cardCollected += amount;
        result.cardPayments += count;
      }
    }
  }

  result.netCollected = result.totalCollected - result.refundedAmount;

  return result;
};

const getOrderPaymentHistory = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  return Payment.find({ order: orderId })
    .populate("receivedBy", "name email role")
    .sort({ paidAt: -1 });
};

module.exports = {
  getAllPayments,
  getPaymentSummary,
  getOrderPaymentHistory,
};

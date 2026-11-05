const mongoose = require("mongoose");
const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");

const getAllOrders = async (query) => {
  const {
    orderStatus,
    paymentStatus,
    orderSource,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 10,
  } = query;

  const filter = {};

  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderSource) filter.orderSource = orderSource;

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) {
        const error = new Error("Invalid startDate");
        error.statusCode = 400;
        throw error;
      }
      filter.createdAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (Number.isNaN(end.getTime())) {
        const error = new Error("Invalid endDate");
        error.statusCode = 400;
        throw error;
      }
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.orderNumber = {
      $regex: escapedSearch,
      $options: "i",
    };
  }

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (currentPage - 1) * pageLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("table", "tableNumber capacity")
      .populate("waiter", "name email")
      .populate("statusUpdatedBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    },
  };
};

const getOrderDetails = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId)
    .populate("table", "tableNumber capacity location")
    .populate("waiter", "name email")
    .populate("statusUpdatedBy", "name role");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

const getOrderHistory = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const orderExists = await Order.exists({ _id: orderId });

  if (!orderExists) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return OrderHistory.find({ order: orderId })
    .populate("changedBy", "name role")
    .sort({ changedAt: 1 });
};

module.exports = {
  getAllOrders,
  getOrderDetails,
  getOrderHistory,
};

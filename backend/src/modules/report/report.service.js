const Order = require("../../models/order.model");
const OrderHistory = require("../../models/orderHistory.model");
const Payment = require("../../models/payment.model");

// Common date filter (UTC)
const getDateFilter = (startDate, endDate) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !regex.test(startDate) ||
    !regex.test(endDate)
  ) {
    const error = new Error(
      "Valid startDate and endDate are required (YYYY-MM-DD)"
    );
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate ||
    end.toISOString().slice(0, 10) !== endDate ||
    start > end
  ) {
    const error = new Error("Invalid date range");
    error.statusCode = 400;
    throw error;
  }

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return {
    $gte: start,
    $lt: endExclusive,
  };
};

// 1. Dashboard Summary
const getDashboardSummary = async () => {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  const todayOrderFilter = {
    createdAt: {
      $gte: startOfToday,
      $lt: startOfTomorrow,
    },
  };

  const todayPaymentFilter = {
    status: "SUCCESS",
    paidAt: {
      $gte: startOfToday,
      $lt: startOfTomorrow,
    },
  };

  const [
    totalOrders,
    paidOrders,
    pendingPaymentOrders,
    todayOrders,
    totalRevenueResult,
    todayRevenueResult,
    statusCounts,
  ] = await Promise.all([
    Order.countDocuments(),

    Order.countDocuments({ paymentStatus: "PAID" }),

    Order.countDocuments({ paymentStatus: "PENDING" }),

    Order.countDocuments(todayOrderFilter),

    Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),

    Payment.aggregate([
      { $match: todayPaymentFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),

    Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const ordersByStatus = {};

  statusCounts.forEach((item) => {
    ordersByStatus[item._id] = item.count;
  });

  return {
    overview: {
      totalOrders,
      paidOrders,
      pendingPaymentOrders,
      totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
    },
    today: {
      totalOrders: todayOrders,
      revenue: todayRevenueResult[0]?.totalRevenue || 0,
    },
    ordersByStatus,
  };
};

// 2. Date-wise Sales Report
const getDateWiseSalesReport = async (startDate, endDate) => {
  const dateFilter = getDateFilter(startDate, endDate);

  const orderDateFilter = {
    createdAt: dateFilter,
  };

  const paymentDateFilter = {
    status: "SUCCESS",
    paidAt: dateFilter,
  };

  const [
    totalOrders,
    pendingOrders,
    paidOrderIds,
    revenueResult,
    dailySales,
  ] = await Promise.all([
    Order.countDocuments(orderDateFilter),

    Order.countDocuments({
      ...orderDateFilter,
      paymentStatus: "PENDING",
    }),

    Payment.distinct("order", paymentDateFilter),

    Payment.aggregate([
      { $match: paymentDateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),

    Payment.aggregate([
      { $match: paymentDateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$paidAt",
              timezone: "UTC",
            },
          },
          payments: { $sum: 1 },
          revenue: { $sum: "$amount" },
          orderIds: { $addToSet: "$order" },
        },
      },
      {
        $project: {
          date: "$_id",
          _id: 0,
          payments: 1,
          revenue: 1,
          paidOrders: { $size: "$orderIds" },
        },
      },
      { $sort: { date: 1 } },
    ]),
  ]);

  return {
    dateRange: { startDate, endDate },
    summary: {
      totalOrders,
      paidOrders: paidOrderIds.length,
      pendingOrders,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
    },
    dailySales,
  };
};

// 3. Best-selling Menu Items
const getBestSellingItems = async (startDate, endDate, limit = 10) => {
  const dateFilter = getDateFilter(startDate, endDate);
  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    const error = new Error("Limit must be between 1 and 100");
    error.statusCode = 400;
    throw error;
  }

  return Order.aggregate([
    {
      $match: {
        createdAt: dateFilter,
        paymentStatus: "PAID",
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          menuItem: "$items.menuItem",
          name: "$items.name",
        },
        totalQuantity: { $sum: "$items.quantity" },
        totalSales: { $sum: "$items.subtotal" },
        orderIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 0,
        menuItemId: "$_id.menuItem",
        itemName: "$_id.name",
        totalQuantity: 1,
        totalSales: 1,
        totalOrders: { $size: "$orderIds" },
      },
    },
    { $sort: { totalQuantity: -1, totalSales: -1 } },
    { $limit: parsedLimit },
  ]);
};

// 4. Cash vs Card Collection
const getPaymentMethodReport = async (startDate, endDate) => {
  const dateFilter = getDateFilter(startDate, endDate);

  const result = await Payment.aggregate([
    {
      $match: {
        status: "SUCCESS",
        method: { $in: ["CASH", "CARD"] },
        paidAt: dateFilter,
      },
    },
    {
      $group: {
        _id: "$method",
        totalAmount: { $sum: "$amount" },
        totalPayments: { $sum: 1 },
      },
    },
  ]);

  const report = {
    CASH: { totalAmount: 0, totalPayments: 0 },
    CARD: { totalAmount: 0, totalPayments: 0 },
  };

  result.forEach((item) => {
    report[item._id] = {
      totalAmount: item.totalAmount,
      totalPayments: item.totalPayments,
    };
  });

  return {
    dateRange: { startDate, endDate },
    paymentMethods: report,
    totalCollection:
      report.CASH.totalAmount + report.CARD.totalAmount,
    totalPayments:
      report.CASH.totalPayments + report.CARD.totalPayments,
  };
};

// 5. Staff-wise Performance
const getStaffPerformance = async (startDate, endDate) => {
  const dateFilter = getDateFilter(startDate, endDate);

  return Order.aggregate([
    {
      $match: {
        createdAt: dateFilter,
        paymentStatus: "PAID",
        orderSource: "WAITER",
        waiter: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$waiter",
        totalOrders: { $sum: 1 },
        totalSales: { $sum: "$totalAmount" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "staff",
      },
    },
    { $unwind: "$staff" },
    {
      $project: {
        _id: 0,
        staffId: "$staff._id",
        staffName: "$staff.name",
        email: "$staff.email",
        totalOrders: 1,
        totalSales: 1,
      },
    },
    { $sort: { totalOrders: -1 } },
  ]);
};

// 6. Order History Report
const getOrderHistoryReport = async (startDate, endDate, status) => {
  const dateFilter = getDateFilter(startDate, endDate);

  const filter = {
    changedAt: dateFilter,
  };

  if (status) {
    const allowedStatuses = [
      "PENDING_PAYMENT",
      "PLACED",
      "PREPARING",
      "READY",
      "SERVED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      const error = new Error("Invalid order history status");
      error.statusCode = 400;
      throw error;
    }

    filter.status = status;
  }

  return OrderHistory.find(filter)
    .populate({
      path: "order",
      select:
        "orderNumber table orderSource totalAmount paymentStatus orderStatus",
      populate: {
        path: "table",
        select: "tableNumber",
      },
    })
    .populate("changedBy", "name role")
    .sort({ changedAt: -1 });
};

module.exports = {
  getDashboardSummary,
  getDateWiseSalesReport,
  getBestSellingItems,
  getPaymentMethodReport,
  getStaffPerformance,
  getOrderHistoryReport,
};
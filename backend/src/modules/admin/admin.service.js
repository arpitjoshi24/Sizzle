
const Order = require("../../models/order.model");
const Payment = require("../../models/payment.model");
const User = require("../../models/user.model");

const getDashboardStats = async () => {
  // Start and end of today in the server's local timezone.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalOrders,
    todayOrders,
    pendingPaymentOrders,
    preparingOrders,
    readyOrders,
    servedOrders,
    totalStaff,
    todaySales,
    todayCashSales,
    todayCardSales
  ] = await Promise.all([
    // All orders
    Order.countDocuments(),

    // Orders created today
    Order.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }),

    // Orders waiting for payment
    Order.countDocuments({
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT"
    }),

    // Orders being prepared
    Order.countDocuments({
      paymentStatus: "PAID",
      orderStatus: "PREPARING"
    }),

    // Orders ready to serve
    Order.countDocuments({
      paymentStatus: "PAID",
      orderStatus: "READY"
    }),

    // Served orders
    Order.countDocuments({
      paymentStatus: "PAID",
      orderStatus: "SERVED"
    }),

    // Active staff accounts
    User.countDocuments({
      isActive: true,
      role: {
        $in: ["ADMIN", "KITCHEN", "WAITER"]
      }
    }),

    // Today's total collected payments
    Payment.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          paidAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]),

    // Today's cash collections
    Payment.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          paymentMethod: "CASH",
          paidAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]),

    // Today's card collections
    Payment.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          paymentMethod: "CARD",
          paidAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ])
  ]);

  return {
    orders: {
      total: totalOrders,
      today: todayOrders,
      pendingPayment: pendingPaymentOrders,
      preparing: preparingOrders,
      ready: readyOrders,
      served: servedOrders
    },

    sales: {
      today: todaySales[0]?.total || 0,
      cash: todayCashSales[0]?.total || 0,
      card: todayCardSales[0]?.total || 0
    },

    staff: {
      total: totalStaff
    }
  };
};

module.exports = {
  getDashboardStats
};

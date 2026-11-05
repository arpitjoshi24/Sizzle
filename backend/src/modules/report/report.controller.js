
const reportService = require("./report.service");

// Dashboard
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const data = await reportService.getDashboardSummary();

    res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Date-wise Sales
exports.getDateWiseSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await reportService.getDateWiseSalesReport(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      message: "Sales report fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Most-selling Items
exports.getBestSellingItems = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const data = await reportService.getBestSellingItems(
      startDate,
      endDate,
      limit
    );

    res.status(200).json({
      success: true,
      message: "Best-selling items fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Cash vs Card
exports.getPaymentMethodReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await reportService.getPaymentMethodReport(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      message: "Payment method report fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Staff Performance
exports.getStaffPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await reportService.getStaffPerformance(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      message: "Staff performance fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Order History
exports.getOrderHistoryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const data = await reportService.getOrderHistoryReport(
      startDate,
      endDate,
      status
    );

    res.status(200).json({
      success: true,
      message: "Order history fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

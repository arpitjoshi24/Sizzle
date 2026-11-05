
const adminPaymentService = require("./adminPayment.service");

const getAllPayments = async (req, res, next) => {
  try {
    const result = await adminPaymentService.getAllPayments(req.query);

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentSummary = async (req, res, next) => {
  try {
    const summary = await adminPaymentService.getPaymentSummary(req.query);

    res.status(200).json({
      success: true,
      message: "Payment summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderPaymentHistory = async (req, res, next) => {
  try {
    const payments = await adminPaymentService.getOrderPaymentHistory(
      req.params.orderId
    );

    res.status(200).json({
      success: true,
      message: "Order payment history fetched successfully",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPayments,
  getPaymentSummary,
  getOrderPaymentHistory,
};

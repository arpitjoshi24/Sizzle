
const paymentService = require("./payment.service");

// Create Razorpay order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createRazorpayOrder(
      req.body.orderId
    );

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Verify Razorpay payment
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const order = await paymentService.verifyRazorpayPayment(
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Record cash/card payment
const recordOfflinePayment = async (req, res, next) => {
  try {
    const order = await paymentService.recordOfflinePayment({
      orderId: req.body.orderId,
      paymentMethod: req.body.paymentMethod,
      transactionReference: req.body.transactionReference,
      staffId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Offline payment recorded successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get order payment history
const getOrderPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getOrderPayments(
      req.params.orderId
    );

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordOfflinePayment,
  getOrderPayments,
};

const paymentService = require("./payment.service");

// Create Razorpay order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createRazorpayOrder(
      req.body.orderId
    );

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Verify Razorpay payment
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const order = await paymentService.verifyRazorpayPayment(
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Record cash/card payment
const recordOfflinePayment = async (req, res, next) => {
  try {
    const order = await paymentService.recordOfflinePayment({
      orderId: req.body.orderId,
      paymentMethod: req.body.paymentMethod,
      transactionReference: req.body.transactionReference,
      staffId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Offline payment recorded successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get order payment history
const getOrderPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getOrderPayments(
      req.params.orderId
    );

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordOfflinePayment,
  getOrderPayments,
};


const paymentService = require("./payment.routes");

exports.recordPayment = async (req, res, next) => {
  try {
    const { orderId, method, notes } = req.body;

    const payment = await paymentService.recordPayment({
      orderId,
      method,
      notes,
      receivedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully. Order sent to kitchen.",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getAllPayments(req.query);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

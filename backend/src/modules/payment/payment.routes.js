
const router = require("express").Router();

const paymentController = require("./payment.controller");

const {
  authenticate,
} = require("../../middleware/auth.middleware");

const {
  authorize,
} = require("../../middleware/role.middleware");

// Public QR payment routes
router.post(
  "/razorpay/create",
  paymentController.createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  paymentController.verifyRazorpayPayment
);

// Staff payment routes
router.post(
  "/offline",
  authenticate,
  authorize("WAITER", "ADMIN"),
  paymentController.recordOfflinePayment
);

// Payment history
router.get(
  "/order/:orderId",
  authenticate,
  authorize("ADMIN"),
  paymentController.getOrderPayments
);

module.exports = router;


const express = require("express");
const router = express.Router();

const paymentController = require("./payment.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

router.use(authenticate);

// Waiter and Admin can record payments
router.post(
  "/",
  authorize("ADMIN", "WAITER"),
  paymentController.recordPayment
);

// Admin can view all payment records
router.get(
  "/",
  authorize("ADMIN"),
  paymentController.getAllPayments
);

// Admin can view individual payment
router.get(
  "/:id",
  authorize("ADMIN"),
  paymentController.getPaymentById
);

console.log({
  authenticate: typeof authenticate,
  authorize: typeof authorize,
  recordPayment: typeof paymentController.recordPayment,
  getAllPayments: typeof paymentController.getAllPayments,
  getPaymentById: typeof paymentController.getPaymentById
});

module.exports = router;

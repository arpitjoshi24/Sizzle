
const express = require("express");
const router = express.Router();

const {
  getAllPayments,
  getPaymentSummary,
  getOrderPaymentHistory,
} = require("./adminPayment.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/summary", getPaymentSummary);
router.get("/order/:orderId", getOrderPaymentHistory);
router.get("/", getAllPayments);

module.exports = router;

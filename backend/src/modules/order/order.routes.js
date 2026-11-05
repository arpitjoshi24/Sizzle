const express = require("express");
const router = express.Router();

const {
  createQROrder,
  createWaiterOrder,
  getAllOrders,
  getOrderById
} = require("./order.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

// Customer QR ordering - no login required
router.post("/qr", createQROrder);

// Waiter creates order and records offline payment
router.post(
  "/waiter",
  authenticate,
  authorize("ADMIN", "WAITER"),
  createWaiterOrder
);

// Staff order viewing
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "WAITER", "KITCHEN"),
  getAllOrders
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "WAITER", "KITCHEN"),
  getOrderById
);

module.exports = router;
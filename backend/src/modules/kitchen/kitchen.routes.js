
const router = require("express").Router();

const kitchenController = require("./kitchen.controller");

const authenticate = require("../../middleware/auth.middleware");

const authorize = require("../../middleware/role.middleware");

// All kitchen routes require authentication
router.use(authenticate);

// Only kitchen staff and admin can access
router.use(authorize("KITCHEN", "ADMIN"));

// Get active kitchen orders
router.get(
  "/orders",
  kitchenController.getKitchenOrders
);

// Start preparing an order
router.patch(
  "/orders/:id/start",
  kitchenController.startPreparingOrder
);

// Mark order ready
router.patch(
  "/orders/:id/ready",
  kitchenController.markOrderReady
);

module.exports = router;

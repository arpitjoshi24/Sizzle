
const router = require("express").Router();

const waiterController = require("./waiter.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

router.use(authenticate);
router.use(authorize("WAITER", "ADMIN"));

router.get(
  "/ready-orders",
  waiterController.getReadyOrders
);

router.get(
  "/orders/:id",
  waiterController.getOrderDetails
);

router.patch(
  "/orders/:id/served",
  waiterController.markOrderServed
);

module.exports = router;

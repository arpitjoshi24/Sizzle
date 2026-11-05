
const express = require("express");
const router = express.Router();

const {
  getAllOrders,
  getOrderDetails,
  getOrderHistory,
} = require("./adminOrder.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize= require("../../middleware/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", getAllOrders);
router.get("/:id/history", getOrderHistory);
router.get("/:id", getOrderDetails);

module.exports = router;

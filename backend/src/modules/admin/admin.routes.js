const express = require("express");
const router = express.Router();

const adminController = require("./admin.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN"));

// GET dashboard statistics
router.get(
  "/dashboard",
  adminController.getDashboardStats
);

module.exports = router;
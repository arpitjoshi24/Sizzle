const express = require("express");
const router = express.Router();

const {
  createMenuItem,
  getMenuItems,
  getMenuItemsByCategory,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
} = require("./meniItem.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

// Public menu viewing for QR customers
router.get("/", getMenuItems);
router.get("/category/:categoryId", getMenuItemsByCategory);
router.get("/:id", getMenuItemById);

// Admin-only management
router.post("/", authenticate, authorize("ADMIN"), createMenuItem);
router.put("/:id", authenticate, authorize("ADMIN"), updateMenuItem);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteMenuItem);

module.exports = router;
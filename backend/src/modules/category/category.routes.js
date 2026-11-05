const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("./category.controller");

const authenticate  = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

// Public/staff category viewing
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin-only operations
router.post("/", authenticate, authorize("ADMIN"), createCategory);
router.put("/:id", authenticate, authorize("ADMIN"), updateCategory);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteCategory);

module.exports = router;
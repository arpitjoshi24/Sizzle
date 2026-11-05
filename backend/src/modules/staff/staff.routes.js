
const express = require("express");
const router = express.Router();

const staffController = require("./staff.controller");

const authenticate = require("../../middleware/auth.middleware");

const authorize = require("../../middleware/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN"));

// Create staff
router.post("/", staffController.createStaff);

// Get all staff
router.get("/", staffController.getAllStaff);

// Get staff by ID
router.get("/:id", staffController.getStaffById);

// Update staff details
router.put("/:id", staffController.updateStaff);

// Activate / deactivate staff
router.patch(
  "/:id/status",
  staffController.updateStaffStatus
);

// Reset staff password
router.patch(
  "/:id/reset-password",
  staffController.resetStaffPassword
);

module.exports = router;

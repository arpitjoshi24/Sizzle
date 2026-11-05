const express = require("express");
const router = express.Router();

const {
  createTable,
  getAllTables,
  getTableById,
  updateTable,
  regenerateTableQR,
  deleteTable,
  getTableByQRToken
} = require("./table.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

// Public route: customer scans QR
router.get("/qr/:token", getTableByQRToken);

// Admin-only routes
router.post("/", authenticate, authorize("ADMIN"), createTable);
router.get("/", authenticate, authorize("ADMIN"), getAllTables);
router.get("/:id", authenticate, authorize("ADMIN"), getTableById);
router.put("/:id", authenticate, authorize("ADMIN"), updateTable);
router.patch("/:id/regenerate-qr", authenticate, authorize("ADMIN"), regenerateTableQR);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteTable);

module.exports = router;
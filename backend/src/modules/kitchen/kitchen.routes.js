
const express = require("express");
const router = express.Router();

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const kitchenController = require("./kitchen.controller");

router.use(authenticate);
router.use(authorize("KITCHEN"));

router.get("/", kitchenController.getKitchenQueue);
router.patch("/:id/status", kitchenController.updateKitchenStatus);

module.exports = router;

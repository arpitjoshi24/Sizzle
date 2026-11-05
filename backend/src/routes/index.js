const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const categoryRoutes = require("../modules/category/category.routes");
const menuItemRoutes = require("../modules/menuItem/menuItem.routes");
const tableRoutes = require("../modules/table/table.routes");
const orderRoutes = require("../modules/order/order.routes");
const kitchenRoutes = require("../modules/kitchen/kitchen.routes");
const waiterRoutes = require("../modules/waiter/waiter.routes");


router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/menu-items", menuItemRoutes);
router.use("/tables", tableRoutes);
router.use("/orders", orderRoutes);
router.use("/kitchen", kitchenRoutes);
router.use("/waiter", waiterRoutes);

module.exports = router;
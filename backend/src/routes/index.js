const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const categoryRoutes = require("../modules/category/category.routes");
const menuItemRoutes = require("../modules/menuItem/menuItem.routes");
const tableRoutes = require("../modules/table/table.routes");
const orderRoutes = require("../modules/order/order.routes");
const kitchenRoutes = require("../modules/kitchen/kitchen.routes");
const waiterRoutes = require("../modules/waiter/waiter.routes");
const staffRoutes = require("../modules/staff/staff.routes");
const paymentRoutes = require("../modules/payment/payment.routes");
const reportRoutes = require("../modules/report/report.routes");



router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/menu-items", menuItemRoutes);
router.use("/tables", tableRoutes);
router.use("/orders", orderRoutes);
router.use("/kitchen", kitchenRoutes);
router.use("/waiter", waiterRoutes);
router.use("/staff", staffRoutes);
router.use(
  "/payments",
  require("../modules/payment/payment.routes")
);
router.use(
  "/admin",
  require("../modules/admin/admin.routes")
);


router.use("/admin/orders", require("../modules/adminOrder/adminOrder.routes"));

router.use("/admin/payments", require("../modules/adminPayment/adminPayment.routes"));

router.use("/table-sessions", require("../modules/tableSession/tableSession.routes"));


router.use("/cart", require("../modules/cart/cart.routes"));
router.use("/payments", paymentRoutes);
router.use("/reports", reportRoutes);


module.exports = router;
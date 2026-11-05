
const router = require("express").Router();

const reportController = require("./report.controller");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard", reportController.getDashboardSummary);

router.get("/sales", reportController.getDateWiseSalesReport);

router.get("/best-selling-items", reportController.getBestSellingItems);

router.get("/payment-methods", reportController.getPaymentMethodReport);

router.get("/staff-performance", reportController.getStaffPerformance);

router.get("/order-history", reportController.getOrderHistoryReport);

module.exports = router;

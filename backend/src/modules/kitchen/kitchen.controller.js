
const kitchenService = require("./kitchen.service");

// Get kitchen orders
const getKitchenOrders = async (req, res, next) => {
  try {
    const orders = await kitchenService.getKitchenOrders();

    return res.status(200).json({
      success: true,
      message: "Kitchen orders fetched successfully",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Start preparing
const startPreparingOrder = async (req, res, next) => {
  try {
    const order = await kitchenService.startPreparingOrder(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Order preparation started",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Mark order ready
const markOrderReady = async (req, res, next) => {
  try {
    const order = await kitchenService.markOrderReady(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Order marked as READY",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKitchenOrders,
  startPreparingOrder,
  markOrderReady,
};

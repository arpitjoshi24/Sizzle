
const waiterService = require("./waiter.service");

const getReadyOrders = async (req, res, next) => {
  try {
    const orders = await waiterService.getReadyOrders();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const markOrderServed = async (req, res, next) => {
  try {
    const order = await waiterService.markOrderServed(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Order marked as served",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReadyOrders,
  markOrderServed,
};

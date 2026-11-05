
const adminOrderService = require("./adminOrder.service");

const getAllOrders = async (req, res, next) => {
  try {
    const result = await adminOrderService.getAllOrders(req.query);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderDetails = async (req, res, next) => {
  try {
    const order = await adminOrderService.getOrderDetails(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const history = await adminOrderService.getOrderHistory(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order history fetched successfully",
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderDetails,
  getOrderHistory,
};

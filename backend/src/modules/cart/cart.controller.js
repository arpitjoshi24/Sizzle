
const cartService = require("./cart.service");

const getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.headers["x-table-session"]);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const data = await cartService.addCartItem(
      req.headers["x-table-session"],
      req.body.menuItemId,
      req.body.quantity
    );
    res.status(200).json({ success: true, message: "Item added to cart", data });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const data = await cartService.updateCartItem(
      req.headers["x-table-session"],
      req.params.menuItemId,
      req.body.quantity
    );
    res.status(200).json({ success: true, message: "Cart updated", data });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const data = await cartService.removeCartItem(
      req.headers["x-table-session"],
      req.params.menuItemId
    );
    res.status(200).json({ success: true, message: "Item removed", data });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const data = await cartService.clearCart(req.headers["x-table-session"]);
    res.status(200).json({ success: true, message: "Cart cleared", data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};

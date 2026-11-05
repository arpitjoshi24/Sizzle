
const express = require("express");
const router = express.Router();

const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("./cart.controller");

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:menuItemId", updateCartItem);
router.delete("/items/:menuItemId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;

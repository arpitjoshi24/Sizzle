
const mongoose = require("mongoose");
const Cart = require("../../models/cart.model");
const MenuItem = require("../../models/menuItem.model");
const { validateTableSession } = require("../tableSession/tableSession.service");

const getOrCreateCart = async (sessionId) => {
  return Cart.findOneAndUpdate(
    { session: sessionId },
    { $setOnInsert: { session: sessionId, items: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const getCart = async (sessionToken) => {
  const session = await validateTableSession(sessionToken);
  const cart = await getOrCreateCart(session._id);

  const populatedCart = await Cart.findById(cart._id)
    .populate("items.menuItem", "name price image foodType isAvailable isActive");

  let subtotal = 0;

  const items = populatedCart.items.map((item) => {
    const menuItem = item.menuItem;

    if (menuItem && menuItem.isActive && menuItem.isAvailable) {
      subtotal += menuItem.price * item.quantity;
    }

    return {
      menuItem,
      quantity: item.quantity,
      lineTotal:
        menuItem && menuItem.isActive && menuItem.isAvailable
          ? menuItem.price * item.quantity
          : 0,
    };
  });

  return {
    items,
    subtotal,
    notes: populatedCart.notes,
  };
};

const addCartItem = async (sessionToken, menuItemId, quantity) => {
  const session = await validateTableSession(sessionToken);

  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    const error = new Error("Invalid menu item ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    const error = new Error("Quantity must be between 1 and 50");
    error.statusCode = 400;
    throw error;
  }

  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    isActive: true,
    isAvailable: true,
  });

  if (!menuItem) {
    const error = new Error("Menu item is unavailable");
    error.statusCode = 404;
    throw error;
  }

  const cart = await getOrCreateCart(session._id);
  const existingItem = cart.items.find(
    (item) => item.menuItem.toString() === menuItemId
  );

  if (existingItem) {
    if (existingItem.quantity + quantity > 50) {
      const error = new Error("Maximum quantity per item is 50");
      error.statusCode = 400;
      throw error;
    }
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ menuItem: menuItemId, quantity });
  }

  await cart.save();
  return getCart(sessionToken);
};

const updateCartItem = async (sessionToken, menuItemId, quantity) => {
  const session = await validateTableSession(sessionToken);

  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    const error = new Error("Invalid menu item ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    const error = new Error("Quantity must be between 1 and 50");
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ session: session._id });
  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  const item = cart.items.find(
    (entry) => entry.menuItem.toString() === menuItemId
  );

  if (!item) {
    const error = new Error("Item not found in cart");
    error.statusCode = 404;
    throw error;
  }

  item.quantity = quantity;
  await cart.save();

  return getCart(sessionToken);
};

const removeCartItem = async (sessionToken, menuItemId) => {
  const session = await validateTableSession(sessionToken);

  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    const error = new Error("Invalid menu item ID");
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ session: session._id });
  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  cart.items = cart.items.filter(
    (item) => item.menuItem.toString() !== menuItemId
  );

  await cart.save();
  return getCart(sessionToken);
};

const clearCart = async (sessionToken) => {
  const session = await validateTableSession(sessionToken);
  const cart = await Cart.findOne({ session: session._id });

  if (cart) {
    cart.items = [];
    cart.notes = "";
    await cart.save();
  }

  return { items: [], subtotal: 0, notes: "" };
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};

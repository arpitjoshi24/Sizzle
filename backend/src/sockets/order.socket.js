
const { getIO } = require("../config/socket");

// Send an event to multiple role rooms.
const emitToRoles = (roles, eventName, order) => {
  const io = getIO();

  roles.forEach((role) => {
    io.to(role).emit(eventName, order);
  });
};

// Payment is completed; kitchen can receive the order.
const emitNewOrder = (order) => {
  emitToRoles(
    ["KITCHEN", "ADMIN"],
    "new_order",
    order
  );
};

// Kitchen starts preparing.
const emitOrderPreparing = (order) => {
  emitToRoles(
    ["WAITER", "ADMIN"],
    "order_preparing",
    order
  );
};

// Kitchen finishes preparing.
const emitOrderReady = (order) => {
  emitToRoles(
    ["WAITER", "ADMIN"],
    "order_ready",
    order
  );
};

// Waiter serves the order.
const emitOrderServed = (order) => {
  emitToRoles(
    ["KITCHEN", "ADMIN"],
    "order_served",
    order
  );
};

module.exports = {
  emitNewOrder,
  emitOrderPreparing,
  emitOrderReady,
  emitOrderServed
};

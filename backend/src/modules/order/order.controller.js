const mongoose = require("mongoose");
const crypto = require("crypto");

const Order = require("../../models/order.model");
const Table = require("../../models/table.model");
const MenuItem = require("../../models/menuItem.model");

// Build order items and calculate total using database prices
const buildOrderItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one menu item is required");
  }

  // Combine duplicate menu item IDs
  const quantities = new Map();

  for (const item of items) {
    if (
      !item.menuItem ||
      !mongoose.isValidObjectId(item.menuItem) ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) < 1
    ) {
      throw new Error("Each item needs a valid menuItem ID and positive quantity");
    }

    const id = item.menuItem.toString();
    quantities.set(id, (quantities.get(id) || 0) + Number(item.quantity));
  }

  const menuItems = await MenuItem.find({
    _id: { $in: [...quantities.keys()] },
    isActive: true,
    isAvailable: true
  });

  if (menuItems.length !== quantities.size) {
    throw new Error("One or more menu items are unavailable or invalid");
  }

  const orderItems = menuItems.map((menuItem) => {
    const quantity = quantities.get(menuItem._id.toString());
    const unitPrice = menuItem.price;

    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity
    };
  });

  const subtotal = orderItems.reduce(
    (total, item) => total + item.subtotal,
    0
  );

  return { orderItems, subtotal };
};

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

// CREATE ORDER FROM CUSTOMER QR CODE
exports.createQROrder = async (req, res) => {
  try {
    const {
      tableToken,
      items,
      customerName,
      customerPhone,
      notes
    } = req.body;

    if (!tableToken) {
      return res.status(400).json({
        success: false,
        message: "Table QR token is required"
      });
    }

    const table = await Table.findOne({
      qrToken: tableToken,
      isActive: true
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive table QR code"
      });
    }

    const { orderItems, subtotal } = await buildOrderItems(items);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      table: table._id,
      orderSource: "QR",
      items: orderItems,
      customerName,
      customerPhone,
      subtotal,
      totalAmount: subtotal,
      paymentMethod: "ONLINE",
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
      notes
    });

    res.status(201).json({
      success: true,
      message: "Order created. Complete online payment to confirm it.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        tableNumber: table.tableNumber,
        items: order.items,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// CREATE ORDER BY WAITER
exports.createWaiterOrder = async (req, res) => {
  try {
    const {
      tableId,
      items,
      customerName,
      customerPhone,
      paymentMethod,
      notes
    } = req.body;

    if (!tableId || !mongoose.isValidObjectId(tableId)) {
      return res.status(400).json({
        success: false,
        message: "A valid table ID is required"
      });
    }

    if (!["CASH", "CARD"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Waiter orders must record CASH or CARD payment"
      });
    }

    const table = await Table.findOne({
      _id: tableId,
      isActive: true
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Active table not found"
      });
    }

    const { orderItems, subtotal } = await buildOrderItems(items);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      table: table._id,
      orderSource: "WAITER",
      items: orderItems,
      customerName,
      customerPhone,
      waiter: req.user.id,
      subtotal,
      totalAmount: subtotal,
      paymentMethod,
      paymentStatus: "PAID",
      orderStatus: "PLACED",
      notes
    });

    res.status(201).json({
      success: true,
      message: "Waiter order created and offline payment recorded",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        tableNumber: table.tableNumber,
        items: order.items,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        orderSource: order.orderSource,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL ORDERS (ADMIN / WAITER / KITCHEN)
exports.getAllOrders = async (req, res) => {
  try {
    const filter = {};

    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus.toUpperCase();
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus.toUpperCase();
    }

    if (req.query.orderSource) {
      filter.orderSource = req.query.orderSource.toUpperCase();
    }

    const orders = await Order.find(filter)
      .populate("table", "tableNumber")
      .populate("waiter", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("table", "tableNumber")
      .populate("waiter", "name");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
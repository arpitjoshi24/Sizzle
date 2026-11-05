const crypto = require("crypto");
const QRCode = require("qrcode");
const mongoose = require("mongoose");
const Table = require("../../models/table.model");

// Generate a unique random token
const generateQRToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate QR code image
const generateQRCode = async (token) => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  const qrUrl = `${frontendUrl.replace(/\/$/, "")}/table/${token}`;

  return QRCode.toDataURL(qrUrl);
};

// CREATE TABLE
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location } = req.body;

    if (!tableNumber || !String(tableNumber).trim() || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Table number and capacity are required"
      });
    }

    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a positive whole number"
      });
    }

    const token = generateQRToken();

    const table = await Table.create({
      tableNumber: String(tableNumber).trim(),
      capacity: Number(capacity),
      location,
      qrToken: token
    });

    const qrCode = await generateQRCode(token);

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
        isActive: table.isActive,
        qrCode
      }
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Table number already exists"
          : error.message
    });
  }
};

// GET ALL TABLES (ADMIN)
exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find()
      .select("+qrToken")
      .sort({ tableNumber: 1 });

    const result = await Promise.all(
      tables.map(async (table) => ({
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
        isActive: table.isActive,
        qrCode: await generateQRCode(table.qrToken)
      }))
    );

    res.status(200).json({
      success: true,
      count: result.length,
      tables: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE TABLE (ADMIN)
exports.getTableById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID"
      });
    }

    const table = await Table.findById(req.params.id).select("+qrToken");

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    const qrCode = await generateQRCode(table.qrToken);

    res.status(200).json({
      success: true,
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
        isActive: table.isActive,
        qrCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE TABLE (ADMIN)
exports.updateTable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID"
      });
    }

    const updates = {};
    const allowedFields = ["tableNumber", "capacity", "location", "isActive"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.tableNumber !== undefined) {
      if (!String(updates.tableNumber).trim()) {
        return res.status(400).json({
          success: false,
          message: "Table number cannot be empty"
        });
      }
      updates.tableNumber = String(updates.tableNumber).trim();
    }

    if (updates.capacity !== undefined) {
      if (!Number.isInteger(Number(updates.capacity)) || Number(updates.capacity) < 1) {
        return res.status(400).json({
          success: false,
          message: "Capacity must be a positive whole number"
        });
      }
      updates.capacity = Number(updates.capacity);
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("+qrToken");

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Table updated successfully",
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
        isActive: table.isActive,
        qrCode: await generateQRCode(table.qrToken)
      }
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Table number already exists"
          : error.message
    });
  }
};

// REGENERATE TABLE QR CODE (ADMIN)
exports.regenerateTableQR = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID"
      });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { $set: { qrToken: generateQRToken() } },
      { new: true, runValidators: true }
    ).select("+qrToken");

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "QR code regenerated successfully. The old QR code is no longer valid.",
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        qrCode: await generateQRCode(table.qrToken)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DEACTIVATE TABLE (ADMIN)
exports.deleteTable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID"
      });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Table deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUBLIC: CUSTOMER SCANS QR CODE
exports.getTableByQRToken = async (req, res) => {
  try {
    const table = await Table.findOne({
      qrToken: req.params.token,
      isActive: true
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive table QR code"
      });
    }

    res.status(200).json({
      success: true,
      message: "Table identified successfully",
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
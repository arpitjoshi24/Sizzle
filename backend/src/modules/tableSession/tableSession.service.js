
const crypto = require("crypto");
const Table = require("../../models/table.model");
const TableSession = require("../../models/tableSession.model");

const SESSION_DURATION_HOURS = 4;

const createTableSession = async (tableToken) => {
  if (!tableToken) {
    const error = new Error("Table QR token is required");
    error.statusCode = 400;
    throw error;
  }

  const table = await Table.findOne({
    qrToken: tableToken,
    isActive: true,
  });

  if (!table) {
    const error = new Error("Invalid or inactive table QR code");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000
  );

  const sessionToken = crypto.randomBytes(32).toString("hex");

  const session = await TableSession.create({
    table: table._id,
    sessionToken,
    expiresAt,
  });

  return {
    sessionToken,
    expiresAt,
    table: {
      id: table._id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
    },
  };
};

const validateTableSession = async (sessionToken) => {
  if (!sessionToken) {
    const error = new Error("Customer session token is required");
    error.statusCode = 401;
    throw error;
  }

  const session = await TableSession.findOne({
    sessionToken,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() },
  })
    .select("+sessionToken")
    .populate("table", "tableNumber capacity isActive");

  if (!session || !session.table || !session.table.isActive) {
    const error = new Error("Customer session is invalid or expired");
    error.statusCode = 401;
    throw error;
  }

  return session;
};

const closeTableSession = async (sessionToken) => {
  const session = await validateTableSession(sessionToken);

  session.status = "CLOSED";
  session.closedAt = new Date();

  await session.save();

  return session;
};

module.exports = {
  createTableSession,
  validateTableSession,
  closeTableSession,
};

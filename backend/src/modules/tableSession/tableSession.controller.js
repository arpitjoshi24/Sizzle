
const tableSessionService = require("./tableSession.service");

const createTableSession = async (req, res, next) => {
  try {
    const result = await tableSessionService.createTableSession(
      req.body.tableToken
    );

    res.status(201).json({
      success: true,
      message: "Customer table session created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentSession = async (req, res, next) => {
  try {
    const session = await tableSessionService.validateTableSession(
      req.headers["x-table-session"]
    );

    res.status(200).json({
      success: true,
      message: "Customer session is valid",
      data: {
        table: session.table,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const closeTableSession = async (req, res, next) => {
  try {
    const session = await tableSessionService.closeTableSession(
      req.headers["x-table-session"]
    );

    res.status(200).json({
      success: true,
      message: "Customer session closed successfully",
      data: {
        status: session.status,
        closedAt: session.closedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTableSession,
  getCurrentSession,
  closeTableSession,
};


const adminService = require("./admin.service");

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};

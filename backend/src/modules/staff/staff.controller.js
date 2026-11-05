
const staffService = require("./staff.service");

// Create staff
const createStaff = async (req, res, next) => {
  try {
    const staff = await staffService.createStaff(req.body);

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Get all staff
const getAllStaff = async (req, res, next) => {
  try {
    const staff = await staffService.getAllStaff({
      role: req.query.role,
      isActive: req.query.isActive,
      search: req.query.search
    });

    return res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Get staff by ID
const getStaffById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Update staff
const updateStaff = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaff(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Activate / deactivate staff
const updateStaffStatus = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaffStatus(
      req.params.id,
      req.body.isActive
    );

    return res.status(200).json({
      success: true,
      message: "Staff status updated successfully",
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// Reset staff password
const resetStaffPassword = async (req, res, next) => {
  try {
    const staff = await staffService.resetStaffPassword(
      req.params.id,
      req.body.newPassword
    );

    return res.status(200).json({
      success: true,
      message: "Staff password reset successfully",
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword
};

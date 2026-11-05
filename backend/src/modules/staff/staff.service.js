
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../../models/user.model");

const validateUserId = (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid staff ID");
    error.statusCode = 400;
    throw error;
  }
};

// Create Kitchen or Waiter staff
const createStaff = async ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  if (!["KITCHEN", "WAITER"].includes(role)) {
    const error = new Error("Role must be KITCHEN or WAITER");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail
  });

  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const staff = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    isActive: true
  });

  return {
    _id: staff._id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    isActive: staff.isActive,
    createdAt: staff.createdAt
  };
};

// Get all staff members
const getAllStaff = async ({ role, isActive, search } = {}) => {
  const filter = {
    role: { $in: ["KITCHEN", "WAITER"] }
  };

  if (role) {
    if (!["KITCHEN", "WAITER"].includes(role)) {
      const error = new Error("Invalid staff role");
      error.statusCode = 400;
      throw error;
    }
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } }
    ];
  }

  return User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });
};

// Get staff member by ID
const getStaffById = async (staffId) => {
  validateUserId(staffId);

  const staff = await User.findOne({
    _id: staffId,
    role: { $in: ["KITCHEN", "WAITER"] }
  }).select("-password");

  if (!staff) {
    const error = new Error("Staff member not found");
    error.statusCode = 404;
    throw error;
  }

  return staff;
};

// Update staff details
const updateStaff = async (staffId, updateData) => {
  validateUserId(staffId);

  const staff = await User.findOne({
    _id: staffId,
    role: { $in: ["KITCHEN", "WAITER"] }
  });

  if (!staff) {
    const error = new Error("Staff member not found");
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = ["name", "email", "role"];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (typeof updateData[field] !== "string") {
        const error = new Error(`Invalid ${field}`);
        error.statusCode = 400;
        throw error;
      }

      staff[field] =
        field === "email"
          ? updateData[field].trim().toLowerCase()
          : updateData[field].trim();
    }
  }

  if (
    updateData.role !== undefined &&
    !["KITCHEN", "WAITER"].includes(updateData.role)
  ) {
    const error = new Error("Invalid staff role");
    error.statusCode = 400;
    throw error;
  }

  if (updateData.email !== undefined) {
    const existingUser = await User.findOne({
      email: staff.email,
      _id: { $ne: staffId }
    });

    if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }
  }

  await staff.save();

  return {
    _id: staff._id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    isActive: staff.isActive,
    updatedAt: staff.updatedAt
  };
};

// Activate or deactivate staff
const updateStaffStatus = async (staffId, isActive) => {
  validateUserId(staffId);

  if (typeof isActive !== "boolean") {
    const error = new Error("isActive must be true or false");
    error.statusCode = 400;
    throw error;
  }

  const staff = await User.findOneAndUpdate(
    {
      _id: staffId,
      role: { $in: ["KITCHEN", "WAITER"] }
    },
    {
      $set: { isActive }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password");

  if (!staff) {
    const error = new Error("Staff member not found");
    error.statusCode = 404;
    throw error;
  }

  return staff;
};

// Reset staff password
const resetStaffPassword = async (staffId, newPassword) => {
  validateUserId(staffId);

  if (!newPassword || newPassword.length < 8) {
    const error = new Error(
      "New password must be at least 8 characters"
    );
    error.statusCode = 400;
    throw error;
  }

  const staff = await User.findOne({
    _id: staffId,
    role: { $in: ["KITCHEN", "WAITER"] }
  });

  if (!staff) {
    const error = new Error("Staff member not found");
    error.statusCode = 404;
    throw error;
  }

  staff.password = await bcrypt.hash(newPassword, 12);
  await staff.save();

  return {
    _id: staff._id,
    name: staff.name,
    email: staff.email,
    role: staff.role
  };
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword
};

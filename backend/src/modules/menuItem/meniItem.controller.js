const MenuItem = require("../../models/menuItem.model");
const Category = require("../../models/category.model");

// CREATE MENU ITEM
exports.createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      image,
      foodType
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required"
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number"
      });
    }

    if (!["VEG", "NON_VEG", "EGG"].includes(foodType || "VEG")) {
      return res.status(400).json({
        success: false,
        message: "Invalid food type"
      });
    }

    const categoryExists = await Category.findOne({
      _id: category,
      isActive: true
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Active category not found"
      });
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      category,
      price,
      image,
      foodType
    });

    const populatedItem = await MenuItem.findById(menuItem._id)
      .populate("category", "name");

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem: populatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL MENU ITEMS
exports.getMenuItems = async (req, res) => {
  try {
    const {
      category,
      foodType,
      search,
      isAvailable
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;

    if (foodType) {
      filter.foodType = foodType.toUpperCase();
    }

    if (isAvailable !== undefined) {
      if (!["true", "false"].includes(isAvailable)) {
        return res.status(400).json({
          success: false,
          message: "isAvailable must be true or false"
        });
      }

      filter.isAvailable = isAvailable === "true";
    }

    if (search) {
      filter.name = {
        $regex: search.trim(),
        $options: "i"
      };
    }

    const menuItems = await MenuItem.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET MENU ITEMS BY CATEGORY
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const menuItems = await MenuItem.find({
      category: categoryId,
      isActive: true,
      isAvailable: true
    })
      .populate("category", "name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE MENU ITEM
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      isActive: true
    }).populate("category", "name");

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    res.status(200).json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE MENU ITEM
exports.updateMenuItem = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "category",
      "price",
      "image",
      "foodType",
      "isAvailable",
      "isActive"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    if (updates.price !== undefined &&
        (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number"
      });
    }

    if (updates.foodType &&
        !["VEG", "NON_VEG", "EGG"].includes(updates.foodType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food type"
      });
    }

    if (updates.category) {
      const categoryExists = await Category.findOne({
        _id: updates.category,
        isActive: true
      });

      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Active category not found"
        });
      }
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("category", "name");

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE MENU ITEM (SOFT DELETE)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Menu item deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
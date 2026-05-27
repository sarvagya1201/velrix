import User from "../models/User.js";

const defaultAllocation = {
  needs: 50,
  wants: 30,
  savings: 20,
};

const defaultCategories = [
  { name: "Life Infrastructure", color: "#22C55E" },
  { name: "Future Me", color: "#3B82F6" },
  { name: "Performance & Growth", color: "#A855F7" },
  { name: "Relationships & Generosity", color: "#F59E0B" },
  { name: "Lifestyle Enjoyment", color: "#EF4444" },
];

const defaultPaymentMethods = [
  { name: "Credit Card" },
  { name: "Debit Card" },
  { name: "UPI" },
  { name: "Cash" },
  { name: "Bank Transfer" },
];

const withComputedWeeklyLimits = (user) => {
  const userObject = user.toObject ? user.toObject() : user;

  return {
    ...userObject,
    yearlyBudgets: userObject.yearlyBudgets.map((budget) => {
      const allocation = {
        ...defaultAllocation,
        ...budget.allocation,
      };
      const needsAmount = (budget.salary * allocation.needs) / 100;
      const wantsAmount = (budget.salary * allocation.wants) / 100;

      return {
        ...budget,
        allocation,
        weeklyLimit: (needsAmount + wantsAmount) / 4,
      };
    }),
  };
};

const normalizeYearlyBudgets = (yearlyBudgets = []) => {
  return yearlyBudgets.map((budget) => ({
    year: budget.year,
    salary: budget.salary,
    allocation: {
      ...defaultAllocation,
      ...budget.allocation,
    },
  }));
};

export const setupProfile = async (req, res) => {
  try {
    const {
      yearlyBudgets,
      categories,
      paymentMethods,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!Array.isArray(yearlyBudgets) || yearlyBudgets.length === 0) {
      return res.status(400).json({
        message: "At least one yearly budget is required",
      });
    }

    user.yearlyBudgets = normalizeYearlyBudgets(yearlyBudgets);

    user.categories = Array.isArray(categories) && categories.length > 0
      ? categories
      : defaultCategories;

    user.paymentMethods = Array.isArray(paymentMethods) && paymentMethods.length > 0
      ? paymentMethods
      : defaultPaymentMethods;

    user.isProfileSetupComplete = true;

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile setup completed",
      user: withComputedWeeklyLimits(safeUser),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const addPaymentMethod = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Payment method name is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { paymentMethods: { name } } },
      { new: true }
    ).select("-password");

    res.status(201).json({
      message: "Payment method added",
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        message: "Category name and color are required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { categories: { name, color } } },
      { new: true }
    ).select("-password");

    res.status(201).json({
      message: "Category added",
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    const categoryUpdate = {};

    if (name !== undefined) {
      categoryUpdate["categories.$.name"] = name;
    }

    if (color !== undefined) {
      categoryUpdate["categories.$.color"] = color;
    }

    if (Object.keys(categoryUpdate).length === 0) {
      return res.status(400).json({
        message: "Category name or color is required",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "categories._id": req.params.categoryId,
      },
      {
        $set: categoryUpdate,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.status(200).json({
      message: "Category updated",
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "categories._id": req.params.categoryId,
      },
      {
        $pull: {
          categories: { _id: req.params.categoryId },
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.status(200).json({
      message: "Category deleted",
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Payment method name is required",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "paymentMethods._id": req.params.paymentMethodId,
      },
      {
        $set: {
          "paymentMethods.$.name": name,
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Payment method not found",
      });
    }

    res.status(200).json({
      message: "Payment method updated",
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "paymentMethods._id": req.params.paymentMethodId,
      },
      {
        $pull: {
          paymentMethods: { _id: req.params.paymentMethodId },
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Payment method not found",
      });
    }

    res.status(200).json({
      message: "Payment method deleted",
      user: withComputedWeeklyLimits(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

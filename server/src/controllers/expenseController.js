import Expense from "../models/Expense.js";

const pickExpenseFields = (body) => {
  const allowedFields = [
    "date",
    "description",
    "category",
    "amount",
    "paymentMode",
    "type",
    "notes",
  ];

  return allowedFields.reduce((fields, field) => {
    if (body[field] !== undefined) {
      fields[field] = body[field];
    }

    return fields;
  }, {});
};

export const createExpense = async (req, res) => {
  try {
    const {
      date,
      description,
      category,
      amount,
      paymentMode,
      type,
      notes,
    } = req.body;

    if (!date || !description || !category || amount === undefined || !paymentMode || !type) {
      return res.status(400).json({
        message: "Date, description, category, amount, payment mode, and type are required",
      });
    }

    const expense = await Expense.create({
      user: req.user._id,
      date,
      description,
      category,
      amount,
      paymentMode,
      type,
      notes,
    });

    res.status(201).json({
      message: "Expense added",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });

    res.status(200).json({
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      {
        _id: req.params.expenseId,
        user: req.user._id,
      },
      pickExpenseFields(req.body),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json({
      message: "Expense updated",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.expenseId,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.status(200).json({
      message: "Expense deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

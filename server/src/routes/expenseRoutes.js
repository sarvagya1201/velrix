import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../controllers/expenseController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.route("/:expenseId")
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

export default router;

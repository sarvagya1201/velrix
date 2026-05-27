import express from "express";
import {
  addCategory,
  addPaymentMethod,
  deleteCategory,
  deletePaymentMethod,
  getProfile,
  setupProfile,
  updateCategory,
  updatePaymentMethod,
} from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.post("/setup-profile", protect, setupProfile);
router.put("/setup-profile", protect, setupProfile);
router.post("/categories", protect, addCategory);
router.put("/categories/:categoryId", protect, updateCategory);
router.delete("/categories/:categoryId", protect, deleteCategory);
router.post("/payment-methods", protect, addPaymentMethod);
router.put("/payment-methods/:paymentMethodId", protect, updatePaymentMethod);
router.delete("/payment-methods/:paymentMethodId", protect, deletePaymentMethod);

export default router;

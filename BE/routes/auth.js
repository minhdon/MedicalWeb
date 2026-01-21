import express from "express";
import {
  registerUser,
  loginUser,
  resetPasswordRequest,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/forgot-password
router.post("/forgot-password", resetPasswordRequest);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

// POST /api/auth/change-password
router.post("/change-password", changePassword);

export default router;

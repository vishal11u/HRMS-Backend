import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  getEmployeeAnalytics,
  getDashboardStats,
  getTeamPerformance,
  getDepartmentAnalytics,
  updateEmployeeAnalytics
} from "../controllers/analyticsController.js";

const router = express.Router();

// Get employee analytics
router.get("/employee", verifyToken, getEmployeeAnalytics);

// Get dashboard statistics
router.get("/dashboard", verifyToken, getDashboardStats);

// Get team performance analytics
router.get("/team", verifyToken, getTeamPerformance);

// Get department analytics
router.get("/department", verifyToken, getDepartmentAnalytics);

// Update employee analytics (admin only)
router.post("/employee", verifyToken, updateEmployeeAnalytics);

export default router; 
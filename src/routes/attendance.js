import express from "express";
import { verifyToken, allowRoles, checkPermission } from "../middlewares/authMiddleware.js";
import {
  clockIn,
  clockOut,
  getTodayStatus,
  getAttendanceHistory,
  getAttendanceStats
} from "../controllers/attendanceController.js";

const router = express.Router();

// Clock in/out routes
router.post("/clock-in", verifyToken, clockIn);
router.post("/clock-out", verifyToken, clockOut);
router.get("/today", verifyToken, getTodayStatus);

// Attendance history and stats routes
router.get("/history", verifyToken, getAttendanceHistory);
router.get("/stats", verifyToken, getAttendanceStats);

// Admin routes for viewing other users' attendance
router.get("/history/:userId", verifyToken, allowRoles([1, 2]), getAttendanceHistory);
router.get("/stats/:userId", verifyToken, allowRoles([1, 2]), getAttendanceStats);

export default router; 
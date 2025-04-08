import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  createOvertimeRequest,
  getOvertimeRequests,
  updateOvertimeRequest,
  createShift,
  assignShift,
  getEmployeeShifts,
  getOvertimeReports
} from "../controllers/overtimeController.js";

const router = express.Router();

// Overtime routes
router.post("/requests", verifyToken, createOvertimeRequest);
router.get("/requests", verifyToken, getOvertimeRequests);
router.put("/requests/:id", verifyToken, allowRoles(['admin', 'hr']), updateOvertimeRequest);
router.get("/reports", verifyToken, allowRoles(['admin', 'hr']), getOvertimeReports);

// Shift routes
router.post("/shifts", verifyToken, allowRoles(['admin', 'hr']), createShift);
router.post("/shifts/assign", verifyToken, allowRoles(['admin', 'hr']), assignShift);
router.get("/shifts", verifyToken, getEmployeeShifts);

export default router; 
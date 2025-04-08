import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  createFeedbackCycle,
  getAllFeedbackCycles,
  getFeedbackCycleById,
  updateFeedbackCycle,
  deleteFeedbackCycle,
  submitFeedback,
  getEmployeeFeedback,
  getFeedbackStatistics,
  getPendingFeedbackRequests,
  createFeedbackRequest,
  updateFeedbackRequestStatus
} from "../controllers/feedbackController.js";

const router = express.Router();

// Feedback cycle routes (admin/HR only)
router.post("/cycles", verifyToken, allowRoles(["admin", "hr"]), createFeedbackCycle);
router.get("/cycles", verifyToken, getAllFeedbackCycles);
router.get("/cycles/:id", verifyToken, getFeedbackCycleById);
router.put("/cycles/:id", verifyToken, allowRoles(["admin", "hr"]), updateFeedbackCycle);
router.delete("/cycles/:id", verifyToken, allowRoles(["admin", "hr"]), deleteFeedbackCycle);

// Feedback submission routes
router.post("/submit", verifyToken, submitFeedback);
router.get("/employee", verifyToken, getEmployeeFeedback);
router.get("/statistics", verifyToken, getFeedbackStatistics);

// Feedback request routes
router.post("/requests", verifyToken, createFeedbackRequest);
router.get("/requests/pending", verifyToken, getPendingFeedbackRequests);
router.put("/requests/:id/status", verifyToken, updateFeedbackRequestStatus);

export default router; 
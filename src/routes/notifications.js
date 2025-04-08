import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from "../controllers/notificationController.js";

const router = express.Router();

// Create notification (admin only)
router.post("/", verifyToken, createNotification);

// Get user's notifications
router.get("/", verifyToken, getUserNotifications);

// Get unread notification count
router.get("/unread/count", verifyToken, getUnreadNotificationCount);

// Mark notification as read
router.put("/:id/read", verifyToken, markNotificationAsRead);

// Mark all notifications as read
router.put("/read-all", verifyToken, markAllNotificationsAsRead);

// Delete notification
router.delete("/:id", verifyToken, deleteNotification);

export default router; 
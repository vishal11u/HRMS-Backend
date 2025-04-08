import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  createRewardPoints,
  getEmployeeRewardPoints,
  getRewardPointsStatistics,
  redeemRewardPoints,
  getRedemptionHistory,
  getTopPerformers
} from "../controllers/rewardsController.js";

const router = express.Router();

// Reward points routes (admin/HR only)
router.post("/points", verifyToken, allowRoles(["admin", "hr"]), createRewardPoints);
router.get("/points/employee", verifyToken, getEmployeeRewardPoints);
router.get("/points/statistics", verifyToken, getRewardPointsStatistics);

// Redemption routes
router.post("/redeem", verifyToken, redeemRewardPoints);
router.get("/redemptions", verifyToken, getRedemptionHistory);

// Top performers route
router.get("/top-performers", verifyToken, getTopPerformers);

export default router; 
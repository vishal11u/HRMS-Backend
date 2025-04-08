import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  getUserPermissions
} from "../controllers/roleController.js";

const router = express.Router();

// Role management routes (admin only)
router.get("/", verifyToken, allowRoles(1), getAllRoles);
router.get("/:id", verifyToken, allowRoles(1), getRoleById);
router.post("/", verifyToken, allowRoles(1), createRole);
router.put("/:id", verifyToken, allowRoles(1), updateRole);
router.delete("/:id", verifyToken, allowRoles(1), deleteRole);

// Permission management routes (admin only)
router.get("/permissions/all", verifyToken, allowRoles(1), getAllPermissions);
router.post("/permissions", verifyToken, allowRoles(1), createPermission);

// Get user permissions (for frontend to check access)
router.get("/user/permissions", verifyToken, getUserPermissions);
router.get("/user/:userId/permissions", verifyToken, allowRoles(1), getUserPermissions);

export default router; 
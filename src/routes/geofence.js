import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  createGeofenceLocation,
  getAllGeofenceLocations,
  getGeofenceLocationById,
  updateGeofenceLocation,
  deleteGeofenceLocation,
  recordGeofenceLog,
  getEmployeeGeofenceLogs,
  checkEmployeeLocation
} from "../controllers/geofenceController.js";

const router = express.Router();

// Geofence location routes (admin/HR only)
router.post("/locations", verifyToken, allowRoles(["admin", "hr"]), createGeofenceLocation);
router.get("/locations", verifyToken, getAllGeofenceLocations);
router.get("/locations/:id", verifyToken, getGeofenceLocationById);
router.put("/locations/:id", verifyToken, allowRoles(["admin", "hr"]), updateGeofenceLocation);
router.delete("/locations/:id", verifyToken, allowRoles(["admin", "hr"]), deleteGeofenceLocation);

// Employee check-in/out routes
router.post("/check", verifyToken, recordGeofenceLog);
router.get("/logs", verifyToken, getEmployeeGeofenceLogs);
router.post("/check-location", verifyToken, checkEmployeeLocation);

export default router; 
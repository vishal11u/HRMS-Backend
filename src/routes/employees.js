import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from "../controllers/employeeController.js";

const router = express.Router();

// Get all employees
router.get("/", verifyToken, getEmployees);

// Get single employee
router.get("/:id", verifyToken, getEmployeeById);

// Create new employee (requires admin role)
router.post("/", verifyToken, allowRoles(1), createEmployee);

// Update employee (requires admin role)
router.put("/:id", verifyToken, allowRoles(1), updateEmployee);

// Delete employee (requires admin role)
router.delete("/:id", verifyToken, allowRoles(1), deleteEmployee);

export default router;

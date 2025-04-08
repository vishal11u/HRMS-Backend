import express from "express";
import { verifyToken, allowRoles } from "../middlewares/authMiddleware.js";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectStatistics
} from "../controllers/projectController.js";

const router = express.Router();

// Project routes
router.post("/", verifyToken, allowRoles(["admin", "hr", "manager"]), createProject);
router.get("/", verifyToken, getAllProjects);
router.get("/:id", verifyToken, getProjectById);
router.put("/:id", verifyToken, allowRoles(["admin", "hr", "manager"]), updateProject);
router.delete("/:id", verifyToken, allowRoles(["admin", "hr"]), deleteProject);

// Project member routes
router.post("/:project_id/members", verifyToken, allowRoles(["admin", "hr", "manager"]), addProjectMember);
router.delete("/:project_id/members/:user_id", verifyToken, allowRoles(["admin", "hr", "manager"]), removeProjectMember);

// Project task routes
router.post("/:project_id/tasks", verifyToken, allowRoles(["admin", "hr", "manager"]), createProjectTask);
router.put("/tasks/:id", verifyToken, allowRoles(["admin", "hr", "manager"]), updateProjectTask);
router.delete("/tasks/:id", verifyToken, allowRoles(["admin", "hr", "manager"]), deleteProjectTask);

// Project statistics route
router.get("/:project_id/statistics", verifyToken, getProjectStatistics);

export default router; 
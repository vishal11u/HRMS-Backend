const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middlewares/authMiddleware");
const {
  getEmployees,
  createEmployee,
} = require("../controllers/employeeController");

router.get("/", verifyToken, getEmployees);
router.post("/", verifyToken, allowRoles(1), createEmployee);  

module.exports = router;

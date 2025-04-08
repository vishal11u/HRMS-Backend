import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

export const allowRoles = (...rolesAllowed) => {
  return (req, res, next) => {
    const userRole = req.user.roleId;
    if (!rolesAllowed.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Access forbidden: insufficient role" });
    }
    next();
  };
};

export const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

      // Get user's role
      const userResult = await pool.query(
        "SELECT role_id FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const roleId = userResult.rows[0].role_id;

      if (!roleId) {
        return res.status(403).json({ error: "User has no role assigned" });
      }

      // Check if role has the required permission
      const permissionResult = await pool.query(
        `
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1 AND p.name = $2
      `,
        [roleId, permissionName]
      );

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({
          error: "Access forbidden: insufficient permissions",
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

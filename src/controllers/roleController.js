import pool from "../config/db.js";

// Get all roles
export const getAllRoles = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
        COUNT(DISTINCT u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id
      ORDER BY r.id
    `);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get role by ID
export const getRoleById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get role details
    const roleResult = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [id]
    );
    
    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Get permissions for this role
    const permissionsResult = await pool.query(`
      SELECT p.* 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `, [id]);
    
    // Get users with this role
    const usersResult = await pool.query(`
      SELECT id, username, email, created_at
      FROM users
      WHERE role_id = $1
    `, [id]);
    
    res.json({
      ...roleResult.rows[0],
      permissions: permissionsResult.rows,
      users: usersResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new role
export const createRole = async (req, res) => {
  const { name, description, permissions } = req.body;
  
  try {
    // Check if role already exists
    const checkResult = await pool.query(
      "SELECT * FROM roles WHERE name = $1",
      [name]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "Role already exists" });
    }
    
    // Start transaction
    await pool.query("BEGIN");
    
    // Create role
    const roleResult = await pool.query(
      "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    
    const roleId = roleResult.rows[0].id;
    
    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [roleId, permissionId]
        );
      }
    }
    
    await pool.query("COMMIT");
    
    res.status(201).json({
      message: "Role created successfully",
      role: roleResult.rows[0]
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

// Update role
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  
  try {
    // Check if role exists
    const checkResult = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Check if new name conflicts with existing role
    if (name) {
      const nameCheckResult = await pool.query(
        "SELECT * FROM roles WHERE name = $1 AND id != $2",
        [name, id]
      );
      
      if (nameCheckResult.rows.length > 0) {
        return res.status(400).json({ error: "Role name already exists" });
      }
    }
    
    // Start transaction
    await pool.query("BEGIN");
    
    // Update role
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    
    values.push(id);
    
    if (updateFields.length > 0) {
      await pool.query(
        `UPDATE roles SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }
    
    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await pool.query(
        "DELETE FROM role_permissions WHERE role_id = $1",
        [id]
      );
      
      // Add new permissions
      for (const permissionId of permissions) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [id, permissionId]
        );
      }
    }
    
    await pool.query("COMMIT");
    
    // Get updated role
    const result = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [id]
    );
    
    res.json({
      message: "Role updated successfully",
      role: result.rows[0]
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

// Delete role
export const deleteRole = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if role exists
    const checkResult = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Check if role is assigned to any users
    const usersResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role_id = $1",
      [id]
    );
    
    if (parseInt(usersResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete role that is assigned to users" 
      });
    }
    
    // Delete role (cascade will handle role_permissions)
    await pool.query("DELETE FROM roles WHERE id = $1", [id]);
    
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all permissions
export const getAllPermissions = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        COUNT(DISTINCT rp.role_id) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      GROUP BY p.id
      ORDER BY p.id
    `);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new permission
export const createPermission = async (req, res) => {
  const { name, description } = req.body;
  
  try {
    // Check if permission already exists
    const checkResult = await pool.query(
      "SELECT * FROM permissions WHERE name = $1",
      [name]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "Permission already exists" });
    }
    
    // Create permission
    const result = await pool.query(
      "INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    
    res.status(201).json({
      message: "Permission created successfully",
      permission: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user permissions
export const getUserPermissions = async (req, res) => {
  const userId = req.params.userId || req.user.userId;
  
  try {
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
      return res.json({ permissions: [] });
    }
    
    // Get permissions for this role
    const result = await pool.query(`
      SELECT p.* 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `, [roleId]);
    
    res.json({
      role_id: roleId,
      permissions: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
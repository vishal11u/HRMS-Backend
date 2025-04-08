import pool from "./db.js";

const initializeRolesAndPermissions = async () => {
  try {
    // Check if roles already exist
    const checkResult = await pool.query(`
      SELECT COUNT(*) FROM roles
    `);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log("✅ Roles and permissions already initialized.");
      return;
    }
    
    // Start transaction
    await pool.query("BEGIN");
    
    // Create default roles
    const roles = [
      { name: "Super Admin", description: "Full system access" },
      { name: "Admin", description: "Administrative access" },
      { name: "HR Manager", description: "HR management access" },
      { name: "Manager", description: "Department management access" },
      { name: "Employee", description: "Basic employee access" }
    ];
    
    const roleIds = {};
    
    for (const role of roles) {
      const result = await pool.query(
        "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id",
        [role.name, role.description]
      );
      
      roleIds[role.name] = result.rows[0].id;
    }
    
    // Create default permissions
    const permissions = [
      // User management
      { name: "view_users", description: "View user list" },
      { name: "create_user", description: "Create new users" },
      { name: "edit_user", description: "Edit user details" },
      { name: "delete_user", description: "Delete users" },
      
      // Role management
      { name: "view_roles", description: "View role list" },
      { name: "create_role", description: "Create new roles" },
      { name: "edit_role", description: "Edit role details" },
      { name: "delete_role", description: "Delete roles" },
      
      // Employee management
      { name: "view_employees", description: "View employee list" },
      { name: "create_employee", description: "Create new employees" },
      { name: "edit_employee", description: "Edit employee details" },
      { name: "delete_employee", description: "Delete employees" },
      
      // Attendance management
      { name: "view_attendance", description: "View attendance records" },
      { name: "manage_attendance", description: "Manage attendance records" },
      { name: "view_attendance_reports", description: "View attendance reports" },
      
      // Dashboard access
      { name: "view_dashboard", description: "Access dashboard" },
      { name: "view_hr_dashboard", description: "Access HR dashboard" },
      { name: "view_manager_dashboard", description: "Access manager dashboard" },
      { name: "view_employee_dashboard", description: "Access employee dashboard" }
    ];
    
    const permissionIds = {};
    
    for (const permission of permissions) {
      const result = await pool.query(
        "INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING id",
        [permission.name, permission.description]
      );
      
      permissionIds[permission.name] = result.rows[0].id;
    }
    
    // Assign permissions to roles
    // Super Admin - all permissions
    for (const permissionId of Object.values(permissionIds)) {
      await pool.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
        [roleIds["Super Admin"], permissionId]
      );
    }
    
    // Admin - most permissions except some super admin ones
    const adminPermissions = Object.entries(permissionIds)
      .filter(([name]) => !name.includes("super_admin"))
      .map(([_, id]) => id);
    
    for (const permissionId of adminPermissions) {
      await pool.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
        [roleIds["Admin"], permissionId]
      );
    }
    
    // HR Manager - HR related permissions
    const hrPermissions = [
      "view_users", "create_user", "edit_user",
      "view_employees", "create_employee", "edit_employee",
      "view_attendance", "manage_attendance", "view_attendance_reports",
      "view_dashboard", "view_hr_dashboard"
    ];
    
    for (const permissionName of hrPermissions) {
      if (permissionIds[permissionName]) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [roleIds["HR Manager"], permissionIds[permissionName]]
        );
      }
    }
    
    // Manager - department management permissions
    const managerPermissions = [
      "view_employees", "edit_employee",
      "view_attendance", "manage_attendance", "view_attendance_reports",
      "view_dashboard", "view_manager_dashboard"
    ];
    
    for (const permissionName of managerPermissions) {
      if (permissionIds[permissionName]) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [roleIds["Manager"], permissionIds[permissionName]]
        );
      }
    }
    
    // Employee - basic permissions
    const employeePermissions = [
      "view_attendance",
      "view_dashboard", "view_employee_dashboard"
    ];
    
    for (const permissionName of employeePermissions) {
      if (permissionIds[permissionName]) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [roleIds["Employee"], permissionIds[permissionName]]
        );
      }
    }
    
    await pool.query("COMMIT");
    console.log("✅ Default roles and permissions initialized successfully.");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Error initializing roles and permissions:", err.message);
  }
};

export default initializeRolesAndPermissions; 
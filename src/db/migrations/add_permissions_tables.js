import pool from "../../config/db.js";

const addPermissionsTables = async () => {
  try {
    // Check if permissions table exists
    const checkPermissionsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      );
    `);
    
    if (checkPermissionsResult.rows[0].exists) {
      console.log("✅ Permissions table already exists.");
      return;
    }
    
    // Start transaction
    await pool.query("BEGIN");
    
    // Create permissions table
    await pool.query(`
      CREATE TABLE permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Created permissions table successfully.");
    
    // Create role_permissions table
    await pool.query(`
      CREATE TABLE role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
      )
    `);
    
    console.log("✅ Created role_permissions table successfully.");
    
    await pool.query("COMMIT");
    console.log("✅ Permissions tables created successfully.");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Error creating permissions tables:", err.message);
  }
};

export default addPermissionsTables; 
import pool from "../../config/db.js";

const addDescriptionToRoles = async () => {
  try {
    // Check if description column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles' AND column_name = 'description'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log("✅ Description column already exists in roles table.");
      return;
    }
    
    // Add description column to roles table
    await pool.query(`
      ALTER TABLE roles 
      ADD COLUMN description TEXT
    `);
    
    console.log("✅ Added description column to roles table successfully.");
  } catch (err) {
    console.error("❌ Error adding description column to roles table:", err.message);
  }
};

export default addDescriptionToRoles; 
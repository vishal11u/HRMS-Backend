import pool from "../../config/db.js";

const addPasswordResetTokens = async () => {
  try {
    // Check if password_reset_tokens table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log("✅ Password reset tokens table already exists.");
      return;
    }
    
    // Create password_reset_tokens table
    await pool.query(`
      CREATE TABLE password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ Created password_reset_tokens table successfully.");
  } catch (err) {
    console.error("❌ Error creating password_reset_tokens table:", err.message);
  }
};

export default addPasswordResetTokens; 
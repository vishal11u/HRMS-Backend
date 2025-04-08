import pool from '../config/db.js';

const addResetPasswordColumns = async () => {
  try {
    console.log('🔄 Adding reset password columns to users table...');
    
    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('reset_password_token', 'reset_password_expires')
    `);

    if (checkColumns.rows.length === 2) {
      console.log('✅ Reset password columns already exist');
      return;
    }

    // Add columns if they don't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP
    `);

    console.log('✅ Reset password columns added successfully');
  } catch (error) {
    console.error('❌ Error adding reset password columns:', error);
    throw error;
  }
};

export default addResetPasswordColumns; 
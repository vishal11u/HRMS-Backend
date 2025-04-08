import pool from '../config/db.js';

const addTimestampColumns = async () => {
  try {
    console.log('🔄 Adding timestamp columns to users table...');
    
    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('created_at', 'updated_at')
    `);

    if (checkColumns.rows.length === 2) {
      console.log('✅ Timestamp columns already exist');
      return;
    }

    // Add columns if they don't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('✅ Timestamp columns added successfully');
  } catch (error) {
    console.error('❌ Error adding timestamp columns:', error);
    throw error;
  }
};

export default addTimestampColumns; 
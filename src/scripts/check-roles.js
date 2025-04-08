import pool from '../config/db.js';

async function checkRoles() {
  try {
    const result = await pool.query('SELECT * FROM roles');
    console.log('Available roles:');
    console.table(result.rows);
    
    // Check if there are any roles
    if (result.rows.length === 0) {
      console.log('No roles found in the database. Creating default roles...');
      
      // Create default roles
      await pool.query(`
        INSERT INTO roles (name, description) 
        VALUES 
          ('admin', 'Administrator with full access'),
          ('hr', 'Human Resources manager'),
          ('employee', 'Regular employee')
      `);
      
      console.log('Default roles created successfully.');
      
      // Fetch and display the newly created roles
      const newRoles = await pool.query('SELECT * FROM roles');
      console.log('Updated roles:');
      console.table(newRoles.rows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking roles:', error);
    process.exit(1);
  }
}

checkRoles(); 
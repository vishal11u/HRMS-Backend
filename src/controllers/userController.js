import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export const getUserProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username, email, currentPassword, newPassword } = req.body;

  try {
    // If password change is requested
    if (currentPassword && newPassword) {
      const userResult = await pool.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
    }

    // Update other profile information
    if (username || email) {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (username) {
        updateFields.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      if (email) {
        updateFields.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }

      values.push(userId);

      await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }

    // Get updated user profile
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
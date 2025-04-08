import pool from "../config/db.js";

// Create notification
export const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, reference_id, reference_type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [user_id, title, message, type, reference_id, reference_type]
    );
    
    res.status(201).json({
      message: "Notification created successfully",
      notification: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Error creating notification" });
  }
};

// Get user's notifications
export const getUserNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user_id]);
    
    res.status(200).json({
      notifications: result.rows
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(200).json({
      message: "Notification marked as read",
      notification: result.rows[0]
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [user_id]
    );
    
    res.status(200).json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Error marking all notifications as read" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );
    
    res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [user_id]);
    
    res.status(200).json({
      count: result.rows[0].count
    });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ message: "Error fetching unread notification count" });
  }
}; 
import pool from "../config/db.js";

// Create a chat room
export const createChatRoom = async (req, res) => {
  try {
    const { name, type, team_id } = req.body;
    const created_by = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO chat_rooms (name, type, team_id, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, type, team_id, created_by]
    );
    
    res.status(201).json({
      message: "Chat room created successfully",
      chat_room: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating chat room:", error);
    res.status(500).json({ message: "Error creating chat room" });
  }
};

// Get user's chat rooms
export const getUserChatRooms = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await pool.query(`
      SELECT cr.*, 
             t.name as team_name,
             u.name as created_by_name,
             COUNT(cm.id) as unread_messages
      FROM chat_rooms cr
      JOIN chat_participants cp ON cr.id = cp.chat_room_id
      LEFT JOIN teams t ON cr.team_id = t.id
      LEFT JOIN users u ON cr.created_by = u.id
      LEFT JOIN chat_messages cm ON cr.id = cm.chat_room_id AND cm.is_read = false AND cm.sender_id != $1
      WHERE cp.user_id = $1
      GROUP BY cr.id, t.name, u.name
      ORDER BY cr.created_at DESC
    `, [user_id]);
    
    res.status(200).json({
      chat_rooms: result.rows
    });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ message: "Error fetching chat rooms" });
  }
};

// Get chat room messages
export const getChatMessages = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const user_id = req.user.id;
    
    // Mark messages as read
    await pool.query(
      `UPDATE chat_messages 
       SET is_read = true 
       WHERE chat_room_id = $1 AND sender_id != $2 AND is_read = false`,
      [chat_room_id, user_id]
    );
    
    const result = await pool.query(`
      SELECT cm.*, u.name as sender_name, u.profile_picture
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.chat_room_id = $1
      ORDER BY cm.created_at ASC
    `, [chat_room_id]);
    
    res.status(200).json({
      messages: result.rows
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Error fetching chat messages" });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { message } = req.body;
    const sender_id = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO chat_messages (chat_room_id, sender_id, message) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [chat_room_id, sender_id, message]
    );
    
    res.status(201).json({
      message: "Message sent successfully",
      chat_message: result.rows[0]
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

// Add participant to chat room
export const addChatParticipant = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO chat_participants (chat_room_id, user_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [chat_room_id, user_id]
    );
    
    res.status(201).json({
      message: "Participant added successfully",
      participant: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ message: "Error adding participant" });
  }
};

// Remove participant from chat room
export const removeChatParticipant = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.params;
    
    await pool.query(
      `DELETE FROM chat_participants 
       WHERE chat_room_id = $1 AND user_id = $2`,
      [chat_room_id, user_id]
    );
    
    res.status(200).json({
      message: "Participant removed successfully"
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ message: "Error removing participant" });
  }
};

// Get chat room participants
export const getChatParticipants = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    
    const result = await pool.query(`
      SELECT cp.*, u.name, u.email, u.profile_picture
      FROM chat_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_room_id = $1
      ORDER BY cp.joined_at ASC
    `, [chat_room_id]);
    
    res.status(200).json({
      participants: result.rows
    });
  } catch (error) {
    console.error("Error fetching chat participants:", error);
    res.status(500).json({ message: "Error fetching chat participants" });
  }
}; 
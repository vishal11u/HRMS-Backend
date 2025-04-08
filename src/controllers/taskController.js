import pool from "../config/db.js";

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to, team_id, priority, due_date } = req.body;
    const assigned_by = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, team_id, priority, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, assigned_to, assigned_by, team_id, priority, due_date]
    );
    
    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task" });
  }
};

// Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             u1.name as assigned_to_name,
             u2.name as assigned_by_name,
             tm.name as team_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      ORDER BY t.created_at DESC
    `);
    
    res.status(200).json({
      tasks: result.rows
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const taskResult = await pool.query(`
      SELECT t.*, 
             u1.name as assigned_to_name,
             u2.name as assigned_by_name,
             tm.name as team_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      WHERE t.id = $1
    `, [id]);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    const commentsResult = await pool.query(`
      SELECT tc.*, u.name as user_name
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at DESC
    `, [id]);
    
    res.status(200).json({
      task: taskResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Error fetching task" });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      `UPDATE tasks 
       SET status = $1, 
           completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.status(200).json({
      message: "Task status updated successfully",
      task: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Error updating task status" });
  }
};

// Add comment to task
export const addTaskComment = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, comment) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [task_id, user_id, comment]
    );
    
    res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// Get user's tasks
export const getUserTasks = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user.id;
    
    const result = await pool.query(`
      SELECT t.*, 
             u1.name as assigned_to_name,
             u2.name as assigned_by_name,
             tm.name as team_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      LEFT JOIN teams tm ON t.team_id = tm.id
      WHERE t.assigned_to = $1
      ORDER BY t.created_at DESC
    `, [user_id]);
    
    res.status(200).json({
      tasks: result.rows
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ message: "Error fetching user tasks" });
  }
};

// Get task statistics
export const getTaskStatistics = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user.id;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM tasks
      WHERE assigned_to = $1
    `, [user_id]);
    
    res.status(200).json({
      statistics: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching task statistics:", error);
    res.status(500).json({ message: "Error fetching task statistics" });
  }
}; 
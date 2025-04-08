import pool from "../config/db.js";

// Get employee analytics
export const getEmployeeAnalytics = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;
    
    const result = await pool.query(`
      SELECT 
        ea.*,
        u.name as employee_name,
        d.name as department_name
      FROM employee_analytics ea
      JOIN users u ON ea.employee_id = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ea.employee_id = $1 
      AND ea.date BETWEEN $2 AND $3
      ORDER BY ea.date DESC
    `, [employee_id, start_date, end_date]);
    
    res.status(200).json({
      analytics: result.rows
    });
  } catch (error) {
    console.error("Error fetching employee analytics:", error);
    res.status(500).json({ message: "Error fetching employee analytics" });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { start_date, end_date } = req.query;
    
    const result = await pool.query(`
      SELECT 
        ds.*,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
        COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN t.id END) as overdue_tasks,
        AVG(ea.productivity_score) as avg_productivity
      FROM dashboard_stats ds
      LEFT JOIN tasks t ON ds.user_id = t.assigned_to
      LEFT JOIN employee_analytics ea ON ds.user_id = ea.employee_id
      WHERE ds.user_id = $1 
      AND ds.date BETWEEN $2 AND $3
      GROUP BY ds.id
      ORDER BY ds.date DESC
    `, [user_id, start_date, end_date]);
    
    res.status(200).json({
      statistics: result.rows
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
};

// Get team performance analytics
export const getTeamPerformance = async (req, res) => {
  try {
    const { team_id, start_date, end_date } = req.query;
    
    const result = await pool.query(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT tm.user_id) as total_members,
        COUNT(DISTINCT task.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN task.status = 'completed' THEN task.id END) as completed_tasks,
        AVG(ea.productivity_score) as avg_productivity,
        AVG(ea.attendance_hours) as avg_attendance_hours
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN tasks task ON t.id = task.team_id
      LEFT JOIN employee_analytics ea ON tm.user_id = ea.employee_id
      WHERE t.id = $1 
      AND (ea.date BETWEEN $2 AND $3 OR ea.date IS NULL)
      GROUP BY t.id, t.name
    `, [team_id, start_date, end_date]);
    
    res.status(200).json({
      team_performance: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    res.status(500).json({ message: "Error fetching team performance" });
  }
};

// Get department analytics
export const getDepartmentAnalytics = async (req, res) => {
  try {
    const { department_id, start_date, end_date } = req.query;
    
    const result = await pool.query(`
      SELECT 
        d.id as department_id,
        d.name as department_name,
        COUNT(DISTINCT e.user_id) as total_employees,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        AVG(ea.productivity_score) as avg_productivity,
        AVG(ea.attendance_hours) as avg_attendance_hours,
        COUNT(DISTINCT CASE WHEN ea.attendance_hours >= 8 THEN ea.id END)::float / 
        NULLIF(COUNT(DISTINCT ea.id), 0) * 100 as attendance_rate
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      LEFT JOIN tasks t ON e.user_id = t.assigned_to
      LEFT JOIN employee_analytics ea ON e.user_id = ea.employee_id
      WHERE d.id = $1 
      AND (ea.date BETWEEN $2 AND $3 OR ea.date IS NULL)
      GROUP BY d.id, d.name
    `, [department_id, start_date, end_date]);
    
    res.status(200).json({
      department_analytics: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching department analytics:", error);
    res.status(500).json({ message: "Error fetching department analytics" });
  }
};

// Update employee analytics
export const updateEmployeeAnalytics = async (req, res) => {
  try {
    const { employee_id, date, tasks_completed, tasks_pending, attendance_hours, productivity_score } = req.body;
    
    const result = await pool.query(`
      INSERT INTO employee_analytics 
        (employee_id, date, tasks_completed, tasks_pending, attendance_hours, productivity_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (employee_id, date) 
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_pending = EXCLUDED.tasks_pending,
        attendance_hours = EXCLUDED.attendance_hours,
        productivity_score = EXCLUDED.productivity_score
      RETURNING *
    `, [employee_id, date, tasks_completed, tasks_pending, attendance_hours, productivity_score]);
    
    res.status(200).json({
      message: "Employee analytics updated successfully",
      analytics: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating employee analytics:", error);
    res.status(500).json({ message: "Error updating employee analytics" });
  }
}; 
import pool from "../config/db.js";

// Clock in for the current day
export const clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check if already clocked in for today
    const existingRecord = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 
       AND DATE(clock_in) = DATE($2)
       AND clock_out IS NULL`,
      [userId, currentDate]
    );

    if (existingRecord.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Already clocked in for today"
      });
    }

    // Create new attendance record
    const result = await pool.query(
      `INSERT INTO attendance (user_id, clock_in, status)
       VALUES ($1, $2, 'present')
       RETURNING *`,
      [userId, new Date()]
    );

    res.status(201).json({
      success: true,
      message: "Clock in successful",
      attendance: result.rows[0]
    });
  } catch (err) {
    console.error("Clock in error:", err);
    res.status(500).json({
      success: false,
      message: "Error during clock in",
      error: err.message
    });
  }
};

// Clock out for the current day
export const clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Find today's clock in record
    const attendanceRecord = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 
       AND DATE(clock_in) = DATE($2)
       AND clock_out IS NULL`,
      [userId, currentDate]
    );

    if (attendanceRecord.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active clock in found for today"
      });
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(attendanceRecord.rows[0].clock_in);
    const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);

    // Update attendance record with clock out time
    const result = await pool.query(
      `UPDATE attendance 
       SET clock_out = $1, 
           total_hours = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [clockOutTime, totalHours, attendanceRecord.rows[0].id]
    );

    res.status(200).json({
      success: true,
      message: "Clock out successful",
      attendance: result.rows[0]
    });
  } catch (err) {
    console.error("Clock out error:", err);
    res.status(500).json({
      success: false,
      message: "Error during clock out",
      error: err.message
    });
  }
};

// Get today's attendance status
export const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const result = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 
       AND DATE(clock_in) = DATE($2)`,
      [userId, currentDate]
    );

    let status = "not_clocked_in";
    if (result.rows.length > 0) {
      status = result.rows[0].clock_out ? "clocked_out" : "clocked_in";
    }

    res.status(200).json({
      success: true,
      status,
      attendance: result.rows[0] || null
    });
  } catch (err) {
    console.error("Get today status error:", err);
    res.status(500).json({
      success: false,
      message: "Error getting today's status",
      error: err.message
    });
  }
};

// Get attendance history for a user
export const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT a.*, 
             u.username,
             u.email
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = $1
    `;
    const queryParams = [userId];

    if (startDate && endDate) {
      query += ` AND DATE(a.clock_in) BETWEEN $2 AND $3`;
      queryParams.push(startDate, endDate);
    }

    query += ` ORDER BY a.clock_in DESC`;

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      attendance: result.rows
    });
  } catch (err) {
    console.error("Get attendance history error:", err);
    res.status(500).json({
      success: false,
      message: "Error getting attendance history",
      error: err.message
    });
  }
};

// Get attendance statistics for dashboard
export const getAttendanceStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get daily attendance for current month
    const dailyAttendance = await pool.query(
      `SELECT 
        DATE(clock_in) as date,
        COUNT(*) as total_days,
        COUNT(CASE WHEN clock_out IS NOT NULL THEN 1 END) as present_days,
        COALESCE(SUM(total_hours), 0) as total_hours
       FROM attendance
       WHERE user_id = $1
       AND DATE(clock_in) BETWEEN $2 AND $3
       GROUP BY DATE(clock_in)
       ORDER BY date`,
      [userId, firstDayOfMonth, lastDayOfMonth]
    );

    // Get monthly summary
    const monthlySummary = await pool.query(
      `SELECT 
        COUNT(DISTINCT DATE(clock_in)) as total_days,
        COUNT(DISTINCT CASE WHEN clock_out IS NOT NULL THEN DATE(clock_in) END) as present_days,
        COALESCE(SUM(total_hours), 0) as total_hours
       FROM attendance
       WHERE user_id = $1
       AND DATE(clock_in) BETWEEN $2 AND $3`,
      [userId, firstDayOfMonth, lastDayOfMonth]
    );

    // Get attendance by status
    const attendanceByStatus = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM attendance
       WHERE user_id = $1
       AND DATE(clock_in) BETWEEN $2 AND $3
       GROUP BY status`,
      [userId, firstDayOfMonth, lastDayOfMonth]
    );

    res.status(200).json({
      success: true,
      stats: {
        daily: dailyAttendance.rows,
        monthly: monthlySummary.rows[0],
        byStatus: attendanceByStatus.rows
      }
    });
  } catch (err) {
    console.error("Get attendance stats error:", err);
    res.status(500).json({
      success: false,
      message: "Error getting attendance statistics",
      error: err.message
    });
  }
}; 
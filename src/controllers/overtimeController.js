import pool from "../config/db.js";

// Create overtime request
export const createOvertimeRequest = async (req, res) => {
  try {
    const { date, start_time, end_time, hours, reason } = req.body;
    const employee_id = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO overtime_requests 
        (employee_id, date, start_time, end_time, hours, reason) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [employee_id, date, start_time, end_time, hours, reason]
    );
    
    res.status(201).json({
      message: "Overtime request created successfully",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating overtime request:", error);
    res.status(500).json({ message: "Error creating overtime request" });
  }
};

// Get overtime requests
export const getOvertimeRequests = async (req, res) => {
  try {
    const { status, start_date, end_date } = req.query;
    const user_id = req.user.id;
    
    let query = `
      SELECT 
        or.*,
        u.name as employee_name,
        a.name as approver_name
      FROM overtime_requests or
      JOIN users u ON or.employee_id = u.id
      LEFT JOIN users a ON or.approved_by = a.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND or.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND or.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND or.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    // If not admin, only show user's requests
    if (req.user.role !== 'admin') {
      query += ` AND or.employee_id = $${paramCount}`;
      params.push(user_id);
    }
    
    query += ` ORDER BY or.date DESC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      requests: result.rows
    });
  } catch (error) {
    console.error("Error fetching overtime requests:", error);
    res.status(500).json({ message: "Error fetching overtime requests" });
  }
};

// Approve/Reject overtime request
export const updateOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approver_id = req.user.id;
    
    const result = await pool.query(
      `UPDATE overtime_requests 
       SET status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, approver_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Overtime request not found" });
    }
    
    res.status(200).json({
      message: "Overtime request updated successfully",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating overtime request:", error);
    res.status(500).json({ message: "Error updating overtime request" });
  }
};

// Create shift
export const createShift = async (req, res) => {
  try {
    const { name, start_time, end_time, break_duration, department_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO shifts 
        (name, start_time, end_time, break_duration, department_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, start_time, end_time, break_duration, department_id]
    );
    
    res.status(201).json({
      message: "Shift created successfully",
      shift: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    res.status(500).json({ message: "Error creating shift" });
  }
};

// Assign shift to employee
export const assignShift = async (req, res) => {
  try {
    const { employee_id, shift_id, start_date, end_date } = req.body;
    
    const result = await pool.query(
      `INSERT INTO employee_shifts 
        (employee_id, shift_id, start_date, end_date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [employee_id, shift_id, start_date, end_date]
    );
    
    res.status(201).json({
      message: "Shift assigned successfully",
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error("Error assigning shift:", error);
    res.status(500).json({ message: "Error assigning shift" });
  }
};

// Get employee shifts
export const getEmployeeShifts = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;
    
    const result = await pool.query(`
      SELECT 
        es.*,
        s.name as shift_name,
        s.start_time,
        s.end_time,
        s.break_duration,
        u.name as employee_name
      FROM employee_shifts es
      JOIN shifts s ON es.shift_id = s.id
      JOIN users u ON es.employee_id = u.id
      WHERE 1=1
      ${employee_id ? 'AND es.employee_id = $1' : ''}
      ${start_date ? 'AND es.start_date >= $2' : ''}
      ${end_date ? 'AND es.end_date <= $3' : ''}
      ORDER BY es.start_date DESC
    `, [employee_id, start_date, end_date].filter(Boolean));
    
    res.status(200).json({
      shifts: result.rows
    });
  } catch (error) {
    console.error("Error fetching employee shifts:", error);
    res.status(500).json({ message: "Error fetching employee shifts" });
  }
};

// Get overtime reports
export const getOvertimeReports = async (req, res) => {
  try {
    const { start_date, end_date, department_id } = req.query;
    
    const result = await pool.query(`
      SELECT 
        or.*,
        u.name as employee_name,
        d.name as department_name,
        a.name as approver_name
      FROM overtime_requests or
      JOIN users u ON or.employee_id = u.id
      JOIN employees e ON u.id = e.user_id
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN users a ON or.approved_by = a.id
      WHERE or.status = 'approved'
      ${start_date ? 'AND or.date >= $1' : ''}
      ${end_date ? 'AND or.date <= $2' : ''}
      ${department_id ? 'AND d.id = $3' : ''}
      ORDER BY or.date DESC
    `, [start_date, end_date, department_id].filter(Boolean));
    
    res.status(200).json({
      reports: result.rows
    });
  } catch (error) {
    console.error("Error fetching overtime reports:", error);
    res.status(500).json({ message: "Error fetching overtime reports" });
  }
}; 
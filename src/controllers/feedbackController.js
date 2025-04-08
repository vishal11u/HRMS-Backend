import pool from "../config/db.js";

// Create feedback cycle
export const createFeedbackCycle = async (req, res) => {
  try {
    const { title, description, start_date, end_date, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO feedback_cycles (title, description, start_date, end_date, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, description, start_date, end_date, status]
    );
    
    res.status(201).json({
      message: "Feedback cycle created successfully",
      cycle: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating feedback cycle:", error);
    res.status(500).json({ message: "Error creating feedback cycle" });
  }
};

// Get all feedback cycles
export const getAllFeedbackCycles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM feedback_cycles 
      ORDER BY start_date DESC
    `);
    
    res.status(200).json({
      cycles: result.rows
    });
  } catch (error) {
    console.error("Error fetching feedback cycles:", error);
    res.status(500).json({ message: "Error fetching feedback cycles" });
  }
};

// Get feedback cycle by ID
export const getFeedbackCycleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM feedback_cycles WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback cycle not found" });
    }
    
    res.status(200).json({
      cycle: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching feedback cycle:", error);
    res.status(500).json({ message: "Error fetching feedback cycle" });
  }
};

// Update feedback cycle
export const updateFeedbackCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_date, end_date, status } = req.body;
    
    const result = await pool.query(
      `UPDATE feedback_cycles 
       SET title = $1, description = $2, start_date = $3, end_date = $4, status = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [title, description, start_date, end_date, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback cycle not found" });
    }
    
    res.status(200).json({
      message: "Feedback cycle updated successfully",
      cycle: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating feedback cycle:", error);
    res.status(500).json({ message: "Error updating feedback cycle" });
  }
};

// Delete feedback cycle
export const deleteFeedbackCycle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM feedback_cycles WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback cycle not found" });
    }
    
    res.status(200).json({
      message: "Feedback cycle deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting feedback cycle:", error);
    res.status(500).json({ message: "Error deleting feedback cycle" });
  }
};

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const { cycle_id, employee_id, reviewer_id, rating, comments, strengths, areas_of_improvement } = req.body;
    
    const result = await pool.query(
      `INSERT INTO feedback_submissions (
        cycle_id, employee_id, reviewer_id, rating, comments, strengths, areas_of_improvement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [cycle_id, employee_id, reviewer_id, rating, comments, strengths, areas_of_improvement]
    );
    
    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Error submitting feedback" });
  }
};

// Get feedback for an employee
export const getEmployeeFeedback = async (req, res) => {
  try {
    const { employee_id, cycle_id } = req.query;
    
    let query = `
      SELECT 
        fs.*,
        fc.title as cycle_title,
        u.name as reviewer_name,
        u.role as reviewer_role
      FROM feedback_submissions fs
      JOIN feedback_cycles fc ON fs.cycle_id = fc.id
      JOIN users u ON fs.reviewer_id = u.id
      WHERE fs.employee_id = $1
    `;
    
    const params = [employee_id];
    
    if (cycle_id) {
      query += ` AND fs.cycle_id = $2`;
      params.push(cycle_id);
    }
    
    query += ` ORDER BY fs.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      feedback: result.rows
    });
  } catch (error) {
    console.error("Error fetching employee feedback:", error);
    res.status(500).json({ message: "Error fetching employee feedback" });
  }
};

// Get feedback statistics
export const getFeedbackStatistics = async (req, res) => {
  try {
    const { employee_id, cycle_id } = req.query;
    
    let query = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_feedbacks,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedbacks,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedbacks
      FROM feedback_submissions
      WHERE employee_id = $1
    `;
    
    const params = [employee_id];
    
    if (cycle_id) {
      query += ` AND cycle_id = $2`;
      params.push(cycle_id);
    }
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      statistics: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching feedback statistics:", error);
    res.status(500).json({ message: "Error fetching feedback statistics" });
  }
};

// Get pending feedback requests
export const getPendingFeedbackRequests = async (req, res) => {
  try {
    const { reviewer_id } = req.query;
    
    const result = await pool.query(`
      SELECT 
        fr.*,
        u.name as employee_name,
        u.role as employee_role,
        fc.title as cycle_title
      FROM feedback_requests fr
      JOIN users u ON fr.employee_id = u.id
      JOIN feedback_cycles fc ON fr.cycle_id = fc.id
      WHERE fr.reviewer_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [reviewer_id]);
    
    res.status(200).json({
      requests: result.rows
    });
  } catch (error) {
    console.error("Error fetching pending feedback requests:", error);
    res.status(500).json({ message: "Error fetching pending feedback requests" });
  }
};

// Create feedback request
export const createFeedbackRequest = async (req, res) => {
  try {
    const { cycle_id, employee_id, reviewer_id, due_date } = req.body;
    
    const result = await pool.query(
      `INSERT INTO feedback_requests (cycle_id, employee_id, reviewer_id, due_date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [cycle_id, employee_id, reviewer_id, due_date]
    );
    
    res.status(201).json({
      message: "Feedback request created successfully",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating feedback request:", error);
    res.status(500).json({ message: "Error creating feedback request" });
  }
};

// Update feedback request status
export const updateFeedbackRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      `UPDATE feedback_requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Feedback request not found" });
    }
    
    res.status(200).json({
      message: "Feedback request status updated successfully",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating feedback request status:", error);
    res.status(500).json({ message: "Error updating feedback request status" });
  }
}; 
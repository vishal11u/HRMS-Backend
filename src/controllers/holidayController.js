import pool from "../config/db.js";

// Create holiday
export const createHoliday = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;
    
    const result = await pool.query(
      `INSERT INTO holidays (name, date, type, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, date, type, description]
    );
    
    res.status(201).json({
      message: "Holiday created successfully",
      holiday: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating holiday:", error);
    res.status(500).json({ message: "Error creating holiday" });
  }
};

// Get all holidays
export const getAllHolidays = async (req, res) => {
  try {
    const { year, type } = req.query;
    
    let query = `
      SELECT * FROM holidays 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (year) {
      query += ` AND EXTRACT(YEAR FROM date) = $${paramCount}`;
      params.push(year);
      paramCount++;
    }
    
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    query += ` ORDER BY date ASC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      holidays: result.rows
    });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Error fetching holidays" });
  }
};

// Get holiday by ID
export const getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM holidays WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    
    res.status(200).json({
      holiday: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching holiday:", error);
    res.status(500).json({ message: "Error fetching holiday" });
  }
};

// Update holiday
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, description } = req.body;
    
    const result = await pool.query(
      `UPDATE holidays 
       SET name = $1, date = $2, type = $3, description = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [name, date, type, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    
    res.status(200).json({
      message: "Holiday updated successfully",
      holiday: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({ message: "Error updating holiday" });
  }
};

// Delete holiday
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM holidays WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    
    res.status(200).json({
      message: "Holiday deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ message: "Error deleting holiday" });
  }
};

// Get upcoming holidays
export const getUpcomingHolidays = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const result = await pool.query(`
      SELECT * FROM holidays 
      WHERE date >= CURRENT_DATE 
      ORDER BY date ASC 
      LIMIT $1
    `, [limit]);
    
    res.status(200).json({
      holidays: result.rows
    });
  } catch (error) {
    console.error("Error fetching upcoming holidays:", error);
    res.status(500).json({ message: "Error fetching upcoming holidays" });
  }
};

// Get holiday calendar
export const getHolidayCalendar = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        date, 
        type, 
        description,
        EXTRACT(MONTH FROM date) as month
      FROM holidays 
      WHERE EXTRACT(YEAR FROM date) = $1
      ORDER BY date ASC
    `, [currentYear]);
    
    // Group holidays by month
    const calendar = {};
    for (let i = 1; i <= 12; i++) {
      calendar[i] = [];
    }
    
    result.rows.forEach(holiday => {
      calendar[holiday.month].push({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date,
        type: holiday.type,
        description: holiday.description
      });
    });
    
    res.status(200).json({
      year: currentYear,
      calendar
    });
  } catch (error) {
    console.error("Error fetching holiday calendar:", error);
    res.status(500).json({ message: "Error fetching holiday calendar" });
  }
}; 
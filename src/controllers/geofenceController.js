import pool from "../config/db.js";

// Create geofence location
export const createGeofenceLocation = async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius } = req.body;
    
    const result = await pool.query(
      `INSERT INTO geofence_locations (name, address, latitude, longitude, radius) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, address, latitude, longitude, radius]
    );
    
    res.status(201).json({
      message: "Geofence location created successfully",
      location: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating geofence location:", error);
    res.status(500).json({ message: "Error creating geofence location" });
  }
};

// Get all geofence locations
export const getAllGeofenceLocations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM geofence_locations 
      ORDER BY name ASC
    `);
    
    res.status(200).json({
      locations: result.rows
    });
  } catch (error) {
    console.error("Error fetching geofence locations:", error);
    res.status(500).json({ message: "Error fetching geofence locations" });
  }
};

// Get geofence location by ID
export const getGeofenceLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM geofence_locations WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Geofence location not found" });
    }
    
    res.status(200).json({
      location: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching geofence location:", error);
    res.status(500).json({ message: "Error fetching geofence location" });
  }
};

// Update geofence location
export const updateGeofenceLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, radius } = req.body;
    
    const result = await pool.query(
      `UPDATE geofence_locations 
       SET name = $1, address = $2, latitude = $3, longitude = $4, radius = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [name, address, latitude, longitude, radius, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Geofence location not found" });
    }
    
    res.status(200).json({
      message: "Geofence location updated successfully",
      location: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating geofence location:", error);
    res.status(500).json({ message: "Error updating geofence location" });
  }
};

// Delete geofence location
export const deleteGeofenceLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM geofence_locations WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Geofence location not found" });
    }
    
    res.status(200).json({
      message: "Geofence location deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting geofence location:", error);
    res.status(500).json({ message: "Error deleting geofence location" });
  }
};

// Record employee check-in/out
export const recordGeofenceLog = async (req, res) => {
  try {
    const { employee_id, location_id, status } = req.body;
    
    let query;
    let params;
    
    if (status === 'check_in') {
      query = `
        INSERT INTO employee_geofence_logs (employee_id, location_id, check_in_time, status) 
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3) 
        RETURNING *
      `;
      params = [employee_id, location_id, status];
    } else if (status === 'check_out') {
      query = `
        UPDATE employee_geofence_logs 
        SET check_out_time = CURRENT_TIMESTAMP, status = $3 
        WHERE employee_id = $1 AND location_id = $2 AND check_out_time IS NULL 
        RETURNING *
      `;
      params = [employee_id, location_id, status];
    } else {
      return res.status(400).json({ message: "Invalid status. Must be 'check_in' or 'check_out'" });
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No active check-in found for check-out" });
    }
    
    res.status(200).json({
      message: `Employee ${status} recorded successfully`,
      log: result.rows[0]
    });
  } catch (error) {
    console.error("Error recording geofence log:", error);
    res.status(500).json({ message: "Error recording geofence log" });
  }
};

// Get employee geofence logs
export const getEmployeeGeofenceLogs = async (req, res) => {
  try {
    const { employee_id, start_date, end_date, location_id } = req.query;
    
    let query = `
      SELECT 
        egl.*,
        gl.name as location_name,
        gl.address,
        u.name as employee_name
      FROM employee_geofence_logs egl
      JOIN geofence_locations gl ON egl.location_id = gl.id
      JOIN users u ON egl.employee_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (employee_id) {
      query += ` AND egl.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }
    
    if (location_id) {
      query += ` AND egl.location_id = $${paramCount}`;
      params.push(location_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND DATE(egl.check_in_time) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND DATE(egl.check_in_time) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ` ORDER BY egl.check_in_time DESC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      logs: result.rows
    });
  } catch (error) {
    console.error("Error fetching employee geofence logs:", error);
    res.status(500).json({ message: "Error fetching employee geofence logs" });
  }
};

// Check if employee is within geofence
export const checkEmployeeLocation = async (req, res) => {
  try {
    const { employee_id, latitude, longitude } = req.body;
    
    // Get all geofence locations
    const locationsResult = await pool.query(`
      SELECT * FROM geofence_locations
    `);
    
    const locations = locationsResult.rows;
    const employeeLocation = { latitude, longitude };
    
    // Check if employee is within any geofence
    const withinGeofence = locations.filter(location => {
      const distance = calculateDistance(
        employeeLocation.latitude,
        employeeLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      return distance <= location.radius;
    });
    
    res.status(200).json({
      is_within_geofence: withinGeofence.length > 0,
      locations: withinGeofence
    });
  } catch (error) {
    console.error("Error checking employee location:", error);
    res.status(500).json({ message: "Error checking employee location" });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
} 
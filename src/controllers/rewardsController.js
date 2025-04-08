import pool from "../config/db.js";

// Create reward points
export const createRewardPoints = async (req, res) => {
  try {
    const { employee_id, points, reason, awarded_by } = req.body;
    
    const result = await pool.query(
      `INSERT INTO reward_points (employee_id, points, reason, awarded_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [employee_id, points, reason, awarded_by]
    );
    
    res.status(201).json({
      message: "Reward points created successfully",
      reward: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating reward points:", error);
    res.status(500).json({ message: "Error creating reward points" });
  }
};

// Get employee reward points
export const getEmployeeRewardPoints = async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    const result = await pool.query(`
      SELECT 
        rp.*,
        u.name as awarded_by_name,
        u.role as awarded_by_role
      FROM reward_points rp
      JOIN users u ON rp.awarded_by = u.id
      WHERE rp.employee_id = $1
      ORDER BY rp.created_at DESC
    `, [employee_id]);
    
    res.status(200).json({
      rewards: result.rows
    });
  } catch (error) {
    console.error("Error fetching employee reward points:", error);
    res.status(500).json({ message: "Error fetching employee reward points" });
  }
};

// Get reward points statistics
export const getRewardPointsStatistics = async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    const result = await pool.query(`
      SELECT 
        SUM(points) as total_points,
        COUNT(*) as total_rewards,
        MAX(created_at) as last_reward_date
      FROM reward_points
      WHERE employee_id = $1
    `, [employee_id]);
    
    res.status(200).json({
      statistics: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching reward points statistics:", error);
    res.status(500).json({ message: "Error fetching reward points statistics" });
  }
};

// Redeem reward points
export const redeemRewardPoints = async (req, res) => {
  try {
    const { employee_id, points_to_redeem, reward_type } = req.body;
    
    // Get total available points
    const pointsResult = await pool.query(`
      SELECT SUM(points) as total_points
      FROM reward_points
      WHERE employee_id = $1
    `, [employee_id]);
    
    const totalPoints = pointsResult.rows[0].total_points || 0;
    
    if (totalPoints < points_to_redeem) {
      return res.status(400).json({ message: "Insufficient reward points" });
    }
    
    // Create redemption record
    const result = await pool.query(
      `INSERT INTO reward_redemptions (employee_id, points_redeemed, reward_type) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [employee_id, points_to_redeem, reward_type]
    );
    
    res.status(201).json({
      message: "Reward points redeemed successfully",
      redemption: result.rows[0]
    });
  } catch (error) {
    console.error("Error redeeming reward points:", error);
    res.status(500).json({ message: "Error redeeming reward points" });
  }
};

// Get redemption history
export const getRedemptionHistory = async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    const result = await pool.query(`
      SELECT * FROM reward_redemptions
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `, [employee_id]);
    
    res.status(200).json({
      redemptions: result.rows
    });
  } catch (error) {
    console.error("Error fetching redemption history:", error);
    res.status(500).json({ message: "Error fetching redemption history" });
  }
};

// Get top performers
export const getTopPerformers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        SUM(rp.points) as total_points,
        COUNT(rp.id) as reward_count
      FROM reward_points rp
      JOIN users u ON rp.employee_id = u.id
      GROUP BY u.id, u.name, u.role
      ORDER BY total_points DESC
      LIMIT $1
    `, [limit]);
    
    res.status(200).json({
      top_performers: result.rows
    });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    res.status(500).json({ message: "Error fetching top performers" });
  }
}; 
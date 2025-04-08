import pool from "../config/db.js";

// Create a new team
export const createTeam = async (req, res) => {
  try {
    const { name, description, leader_id, department_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO teams (name, description, leader_id, department_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, description, leader_id, department_id]
    );
    
    res.status(201).json({
      message: "Team created successfully",
      team: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Error creating team" });
  }
};

// Get all teams
export const getAllTeams = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             u.name as leader_name,
             d.name as department_name,
             COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      GROUP BY t.id, u.name, d.name
      ORDER BY t.created_at DESC
    `);
    
    res.status(200).json({
      teams: result.rows
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Error fetching teams" });
  }
};

// Get team by ID
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const teamResult = await pool.query(`
      SELECT t.*, 
             u.name as leader_name,
             d.name as department_name
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.id = $1
    `, [id]);
    
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    const membersResult = await pool.query(`
      SELECT tm.*, u.name, u.email, u.profile_picture
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
    `, [id]);
    
    res.status(200).json({
      team: teamResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: "Error fetching team" });
  }
};

// Add member to team
export const addTeamMember = async (req, res) => {
  try {
    const { team_id, user_id, role } = req.body;
    
    const result = await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [team_id, user_id, role]
    );
    
    res.status(201).json({
      message: "Member added to team successfully",
      team_member: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({ message: "Error adding team member" });
  }
};

// Remove member from team
export const removeTeamMember = async (req, res) => {
  try {
    const { team_id, user_id } = req.params;
    
    await pool.query(
      `DELETE FROM team_members 
       WHERE team_id = $1 AND user_id = $2`,
      [team_id, user_id]
    );
    
    res.status(200).json({
      message: "Member removed from team successfully"
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({ message: "Error removing team member" });
  }
};

// Update team
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, leader_id, department_id } = req.body;
    
    const result = await pool.query(
      `UPDATE teams 
       SET name = $1, description = $2, leader_id = $3, department_id = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [name, description, leader_id, department_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    res.status(200).json({
      message: "Team updated successfully",
      team: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: "Error updating team" });
  }
};

// Delete team
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      `DELETE FROM teams WHERE id = $1`,
      [id]
    );
    
    res.status(200).json({
      message: "Team deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team" });
  }
}; 
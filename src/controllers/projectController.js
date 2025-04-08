import pool from "../config/db.js";

// Create project
export const createProject = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      start_date, 
      end_date, 
      status, 
      priority, 
      manager_id, 
      budget 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO projects (
        name, description, start_date, end_date, status, priority, manager_id, budget
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [name, description, start_date, end_date, status, priority, manager_id, budget]
    );
    
    res.status(201).json({
      message: "Project created successfully",
      project: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project" });
  }
};

// Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.name as manager_name,
        u.role as manager_role,
        COUNT(pm.id) as team_size
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      GROUP BY p.id, u.name, u.role
      ORDER BY p.created_at DESC
    `);
    
    res.status(200).json({
      projects: result.rows
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const projectResult = await pool.query(
      `SELECT 
        p.*,
        u.name as manager_name,
        u.role as manager_role
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = $1`,
      [id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const membersResult = await pool.query(`
      SELECT 
        pm.*,
        u.name,
        u.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [id]);
    
    const tasksResult = await pool.query(`
      SELECT 
        pt.*,
        u.name as assigned_to_name
      FROM project_tasks pt
      LEFT JOIN users u ON pt.assigned_to = u.id
      WHERE pt.project_id = $1
      ORDER BY pt.due_date ASC
    `, [id]);
    
    res.status(200).json({
      project: projectResult.rows[0],
      members: membersResult.rows,
      tasks: tasksResult.rows
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Error fetching project" });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      start_date, 
      end_date, 
      status, 
      priority, 
      manager_id, 
      budget 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, start_date = $3, end_date = $4, 
           status = $5, priority = $6, manager_id = $7, budget = $8, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 
       RETURNING *`,
      [name, description, start_date, end_date, status, priority, manager_id, budget, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(200).json({
      message: "Project updated successfully",
      project: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Error updating project" });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(200).json({
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
};

// Add project member
export const addProjectMember = async (req, res) => {
  try {
    const { project_id, user_id, role } = req.body;
    
    const result = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [project_id, user_id, role]
    );
    
    res.status(201).json({
      message: "Project member added successfully",
      member: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ message: "Error adding project member" });
  }
};

// Remove project member
export const removeProjectMember = async (req, res) => {
  try {
    const { project_id, user_id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM project_members 
       WHERE project_id = $1 AND user_id = $2 
       RETURNING *`,
      [project_id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project member not found" });
    }
    
    res.status(200).json({
      message: "Project member removed successfully"
    });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ message: "Error removing project member" });
  }
};

// Create project task
export const createProjectTask = async (req, res) => {
  try {
    const { 
      project_id, 
      title, 
      description, 
      assigned_to, 
      due_date, 
      priority, 
      status 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO project_tasks (
        project_id, title, description, assigned_to, due_date, priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [project_id, title, description, assigned_to, due_date, priority, status]
    );
    
    res.status(201).json({
      message: "Project task created successfully",
      task: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating project task:", error);
    res.status(500).json({ message: "Error creating project task" });
  }
};

// Update project task
export const updateProjectTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      assigned_to, 
      due_date, 
      priority, 
      status 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE project_tasks 
       SET title = $1, description = $2, assigned_to = $3, due_date = $4, 
           priority = $5, status = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [title, description, assigned_to, due_date, priority, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project task not found" });
    }
    
    res.status(200).json({
      message: "Project task updated successfully",
      task: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating project task:", error);
    res.status(500).json({ message: "Error updating project task" });
  }
};

// Delete project task
export const deleteProjectTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM project_tasks WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project task not found" });
    }
    
    res.status(200).json({
      message: "Project task deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project task:", error);
    res.status(500).json({ message: "Error deleting project task" });
  }
};

// Get project statistics
export const getProjectStatistics = async (req, res) => {
  try {
    const { project_id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM project_tasks
      WHERE project_id = $1
    `, [project_id]);
    
    res.status(200).json({
      statistics: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({ message: "Error fetching project statistics" });
  }
}; 
const pool = require("../config/db");

exports.getEmployees = async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEmployee = async (req, res) => {
  const { name, designation, department } = req.body;
  const createdBy = req.user.userId;

  try {
    const result = await pool.query(
      "INSERT INTO employees (name, designation, department, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, designation, department, createdBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

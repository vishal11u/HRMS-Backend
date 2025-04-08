import pool from "../config/db.js";

export const getEmployees = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u.username as created_by_name
      FROM employees e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u.username as created_by_name
      FROM employees e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createEmployee = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    designation,
    department,
    joining_date,
    salary,
    emergency_contact,
    emergency_phone
  } = req.body;
  const createdBy = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO employees (
        first_name, last_name, email, phone, date_of_birth, gender,
        address, designation, department, joining_date, salary,
        emergency_contact, emergency_phone, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        first_name, last_name, email, phone, date_of_birth, gender,
        address, designation, department, joining_date, salary,
        emergency_contact, emergency_phone, createdBy
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    designation,
    department,
    joining_date,
    salary,
    emergency_contact,
    emergency_phone,
    status
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE employees 
       SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        date_of_birth = COALESCE($5, date_of_birth),
        gender = COALESCE($6, gender),
        address = COALESCE($7, address),
        designation = COALESCE($8, designation),
        department = COALESCE($9, department),
        joining_date = COALESCE($10, joining_date),
        salary = COALESCE($11, salary),
        emergency_contact = COALESCE($12, emergency_contact),
        emergency_phone = COALESCE($13, emergency_phone),
        status = COALESCE($14, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [
        first_name, last_name, email, phone, date_of_birth, gender,
        address, designation, department, joining_date, salary,
        emergency_contact, emergency_phone, status, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

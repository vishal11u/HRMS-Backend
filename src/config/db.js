import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
  } else {
    console.log("Connected to the PostgreSQL database!");
  }
});

export default pool;

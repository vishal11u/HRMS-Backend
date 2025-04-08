import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDatabase = async () => {
  try {
    console.log("🔄 Starting database setup...");

    // Read and execute the schema file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "../db/schema.sql"),
      "utf8"
    );

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(";")
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log("✅ Executed SQL statement successfully");
      } catch (err) {
        // If table already exists, log and continue
        if (err.code === "42P07") {
          console.log("ℹ️ Table already exists, skipping...");
          continue;
        }
        throw err;
      }
    }

    console.log("✅ Database setup completed successfully!");
  } catch (err) {
    console.error("❌ Error setting up database:", err.message);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Run the setup
setupDatabase(); 
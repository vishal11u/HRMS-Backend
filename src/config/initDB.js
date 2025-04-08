import pool from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initializeRolesAndPermissions from "./initRoles.js";
import addDescriptionToRoles from "../db/migrations/add_description_to_roles.js";
import addPermissionsTables from "../db/migrations/add_permissions_tables.js";
import addPasswordResetTokens from "../db/migrations/add_password_reset_tokens.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createTables = async () => {
  try {
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      );
    `);

    const tablesExist = checkResult.rows[0].exists;

    if (tablesExist) {
      console.log("✅ Tables already exist, skipping creation.");
    } else {
      const schemaSQL = fs.readFileSync(
        path.join(__dirname, "../db/schema.sql"),
        "utf8"
      );

      await pool.query(schemaSQL);
      console.log("✅ Tables created successfully.");
    }
    
    // Run migrations
    await addDescriptionToRoles();
    await addPermissionsTables();
    await addPasswordResetTokens();
    
    // Initialize roles and permissions
    await initializeRolesAndPermissions();
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  }
};

export default createTables;

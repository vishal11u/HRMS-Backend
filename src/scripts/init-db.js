import dotenv from "dotenv";
import createTables from "../config/initDB.js";

dotenv.config();

const initializeDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");
    await createTables();
    console.log("✅ Database initialization completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
    process.exit(1);
  }
};

initializeDatabase(); 
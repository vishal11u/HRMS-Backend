import addResetPasswordColumns from '../migrations/add_reset_password_columns.js';
import addTimestampColumns from '../migrations/add_timestamp_columns.js';

const runMigrations = async () => {
  try {
    console.log('🔄 Running migrations...');
    await addResetPasswordColumns();
    await addTimestampColumns();
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
};

runMigrations(); 
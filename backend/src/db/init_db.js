const fs = require('fs');
const path = require('path');
// Import the database pool configuration
const pool = require('../config/db'); 

const initializeDB = async () => {
  try {
    // Read the SQL schema file
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⏳ Initializing database setup...');
    
    // Execute the raw SQL queries
    await pool.query(sql);
    
    console.log('✅ Success! All tables and indexes have been created.');
  } catch (err) {
    console.error('❌ Error executing SQL file:', err);
  } finally {
    // Close the database connection pool gracefully
    pool.end();
  }
};

initializeDB(); 
// @ts-check
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const initializeDB = async () => {
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⏳ Initializing database setup...');
    
    await pool.query(sql);
    
    console.log('✅ Success! All tables and indexes have been created.');
  } catch (err) {
    console.error('❌ Error executing SQL file:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

initializeDB();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const logger = require('../utils/logger');

const initializeDB = async () => {
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    logger.info('⏳ Initializing database setup...');
    
    await pool.query(sql);
    
    logger.info('✅ Success! All tables and indexes have been created.');
  } catch (err) {
    logger.error({ err }, '❌ Error executing SQL file');
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch (cleanupErr) {
      logger.error({ err: cleanupErr }, '❌ Error during pool cleanup');
      process.exitCode = 1;
    }
  }
};

initializeDB().catch((err) => {
  logger.error({ err }, '❌ Unhandled initialization error');
  process.exitCode = 1;
});
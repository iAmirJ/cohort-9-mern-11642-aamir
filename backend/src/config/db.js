// @ts-check
const { Pool } = require('pg');
require('dotenv').config();

/** @type {import('pg').Pool} */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout after 2 seconds if connection fails
});

pool.on('connect', () => {
  console.log('📦 Database connection established successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
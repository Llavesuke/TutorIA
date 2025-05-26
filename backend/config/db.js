import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Create a new Pool instance with the connection string from .env
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false // Required for some Supabase connections
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to become available
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the server on connection errors
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to the Supabase PostgreSQL database');
    release();
  }
});

// Wrapper function to handle database queries with retries
const query = async (text, params, retries = 3) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`Database query error (attempt ${i + 1}/${retries}):`, err);
      lastError = err;
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
};

export default {
  query,
  pool
};

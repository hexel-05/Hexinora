const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL error:', error);
});

async function testConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT NOW() AS now');
    console.log('PostgreSQL connected:', result.rows[0].now);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
};
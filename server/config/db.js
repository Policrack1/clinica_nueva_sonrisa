// server/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'nueva_sonrisa',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '-05:00', // En lugar de 'local', asegura consistencia en la nube
});

// Verificar conexión al iniciar
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL conectado correctamente');
    conn.release();
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
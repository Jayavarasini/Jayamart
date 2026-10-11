// MySQL connection pool + schema bootstrap for JayaMart.
require('dotenv').config();

const mysql = require('mysql2/promise');
const { TABLES } = require('./schema');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'jayamart_db';

let pool = null;

/** Create the database (and app user) if they do not exist yet. */
async function createDatabaseIfNotExists() {
  let connection;
  let needsProvisioning = false;

  try {
    // Fast path: the configured user may already exist.
    connection = await mysql.createConnection(dbConfig);
  } catch {
    // Slow path: bootstrap with the root account, then create the app user.
    needsProvisioning = true;
    const bootstrapConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: process.env.DB_BOOTSTRAP_USER || 'root',
      password: process.env.DB_BOOTSTRAP_PASSWORD || '',
    };
    try {
      connection = await mysql.createConnection(bootstrapConfig);
    } catch (bootstrapError) {
      throw new Error(
        `Cannot connect to MySQL on ${dbConfig.host}:${dbConfig.port} - ` +
          `check DB_USER/DB_PASSWORD in backend/.env (bootstrap failed too: ${bootstrapError.message})`
      );
    }
  }

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    if (needsProvisioning) {
      await connection.query(`CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`, [
        dbConfig.user,
        dbConfig.password,
      ]);
      // Reset the password in case the user existed with a different one.
      await connection
        .query(`ALTER USER ?@'%' IDENTIFIED BY ?`, [dbConfig.user, dbConfig.password])
        .catch(() => {});
    }
    await connection
      .query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO ?@'%'`, [dbConfig.user])
      .catch(() => {});
    await connection.query('FLUSH PRIVILEGES').catch(() => {});
  } finally {
    await connection.end();
  }
}

/** Initialise the pool and create all tables. */
async function initDatabase() {
  await createDatabaseIfNotExists();

  pool = mysql.createPool({
    ...dbConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
  });

  const connection = await pool.getConnection();
  for (const statement of TABLES) {
    await connection.query(statement);
  }
  connection.release();
  return pool;
}

/** Run a query and return the rows. */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Run a query and return the first row (or undefined). */
async function getOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

/** Run several queries inside a transaction. */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initDatabase,
  query,
  getOne,
  withTransaction,
};

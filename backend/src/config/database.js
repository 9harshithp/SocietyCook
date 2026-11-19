import mysql from 'mysql2/promise';
import { ENV } from './env.js';

const isSsl =
  ENV.DATABASE_URL.includes('aivencloud') ||
  ENV.DATABASE_URL.includes('tidbcloud') ||
  ENV.DATABASE_URL.includes('railway') ||
  ENV.DATABASE_URL.includes('ssl') ||
  process.env.DB_SSL === 'true';

export const db = mysql.createPool({
  uri: ENV.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {})
});

export const query = async (sql, args = []) => {
  const [rows] = await db.execute(sql, args);
  return rows;
};

export async function transaction(fn) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const transQuery = async (sql, args = []) => {
      const [rows] = await connection.execute(sql, args);
      return rows;
    };
    const result = await fn(transQuery, connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

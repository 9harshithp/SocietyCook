import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import mysql from 'mysql2/promise';
import { ENV } from './env.js';
import { captureDatabaseError } from './monitoring.js';

const isSsl =
  ENV.DATABASE_URL.includes('aivencloud') ||
  ENV.DATABASE_URL.includes('tidbcloud') ||
  ENV.DATABASE_URL.includes('railway') ||
  ENV.DATABASE_URL.includes('ssl') ||
  process.env.DB_SSL === 'true';

const poolConfig = {
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
  ...(isSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false } } : {})
};

if (ENV.DATABASE_URL.startsWith('mysql://')) {
  try {
    const u = new URL(ENV.DATABASE_URL);
    poolConfig.host = u.hostname;
    poolConfig.port = Number(u.port) || 3306;
    poolConfig.user = decodeURIComponent(u.username);
    poolConfig.password = decodeURIComponent(u.password);
    const dbName = u.pathname.replace(/^\//, '');
    poolConfig.database = dbName && dbName !== 'sys' ? dbName : 'test';
  } catch (e) {
    poolConfig.uri = ENV.DATABASE_URL;
  }
} else {
  poolConfig.uri = ENV.DATABASE_URL;
}

export const db = mysql.createPool(poolConfig);

export const query = async (sql, args = []) => {
  try {
    const [rows] = await db.execute(sql, args);
    return rows;
  } catch (error) {
    captureDatabaseError(error, sql);
    throw error;
  }
};

export async function transaction(fn) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const transQuery = async (sql, args = []) => {
      try {
        const [rows] = await connection.execute(sql, args);
        return rows;
      } catch (error) {
        captureDatabaseError(error, sql);
        throw error;
      }
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

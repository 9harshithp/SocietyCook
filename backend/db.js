import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQLPUBLICURL ||
  '';
const isSsl =
  dbUrl.includes('aivencloud') ||
  dbUrl.includes('tidbcloud') ||
  dbUrl.includes('railway') ||
  dbUrl.includes('ssl') ||
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

if (dbUrl.startsWith('mysql://')) {
  try {
    const u = new URL(dbUrl);
    poolConfig.host = u.hostname;
    poolConfig.port = Number(u.port) || 3306;
    poolConfig.user = decodeURIComponent(u.username);
    poolConfig.password = decodeURIComponent(u.password);
    const dbName = u.pathname.replace(/^\//, '');
    poolConfig.database = dbName && dbName !== 'sys' ? dbName : 'test';
  } catch (e) {
    poolConfig.uri = dbUrl;
  }
} else {
  poolConfig.uri = dbUrl;
}

export const db = mysql.createPool(poolConfig);
export const query=async(sql,args=[]) => (await db.execute(sql,args))[0];
export async function transaction(fn){const c=await db.getConnection();try{await c.beginTransaction();const result=await fn(async(s,a=[])=>(await c.execute(s,a))[0]);await c.commit();return result}catch(e){await c.rollback();throw e}finally{c.release()}}

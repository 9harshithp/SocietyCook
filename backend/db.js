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

export const db = mysql.createPool({
  uri: dbUrl,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {})
});
export const query=async(sql,args=[]) => (await db.execute(sql,args))[0];
export async function transaction(fn){const c=await db.getConnection();try{await c.beginTransaction();const result=await fn(async(s,a=[])=>(await c.execute(s,a))[0]);await c.commit();return result}catch(e){await c.rollback();throw e}finally{c.release()}}

import 'dotenv/config';
import mysql from 'mysql2/promise';
export const db=mysql.createPool(process.env.DATABASE_URL);
export const query=async(sql,args=[]) => (await db.execute(sql,args))[0];
export async function transaction(fn){const c=await db.getConnection();try{await c.beginTransaction();const result=await fn(async(s,a=[])=>(await c.execute(s,a))[0]);await c.commit();return result}catch(e){await c.rollback();throw e}finally{c.release()}}

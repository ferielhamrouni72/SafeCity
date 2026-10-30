import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

export const pool = globalForDb.pool ?? mysql.createPool(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
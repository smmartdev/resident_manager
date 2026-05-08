import mysql, { Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _dbPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._dbPool) {
    global._dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'resident_manager_db',
      charset: 'utf8mb4',
      timezone: '+00:00',
      decimalNumbers: true,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return global._dbPool;
}

export async function getDataSource() {
  const pool = getPool();
  return {
    query: async (sql: string, params?: any[]) => {
      const [rows] = await pool.execute(sql, params ?? []);
      return rows;
    },
    execute: async (sql: string, params?: any[]) => {
      const [result] = await pool.execute(sql, params ?? []);
      return result;
    },
  };
}
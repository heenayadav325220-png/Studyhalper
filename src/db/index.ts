import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

let dbInstance: any;
if (pool) {
  try {
    dbInstance = drizzle(pool, { schema });
  } catch (err) {
    console.warn('[AI Studio] Database connection error:', err);
    dbInstance = new Proxy({}, {
      get: () => {
        throw new Error("Database connection is unavailable. Persistence failed.");
      }
    });
  }
} else {
  dbInstance = new Proxy({}, {
    get: () => {
      throw new Error("Database connection is not configured. Persistence failed.");
    }
  });
}

export const db = dbInstance;

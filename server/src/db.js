import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST || "localhost",
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT || 5432),
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER || "postgres",
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD || "",
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME || "meetmind_ai",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

export async function query(sql, params = {}) {
  const prepared = prepareNamedQuery(sql, params);
  const result = await pool.query(prepared.text, prepared.values);
  return result.rows;
}

export async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tx = {
      query: async (sql, params = {}) => {
        const prepared = prepareNamedQuery(sql, params);
        const result = await client.query(prepared.text, prepared.values);
        return result.rows;
      }
    };
    const result = await callback(tx);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function prepareNamedQuery(sql, params) {
  if (Array.isArray(params)) {
    return { text: sql, values: params };
  }

  const values = [];
  const indexes = new Map();
  const text = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key) => {
    if (!indexes.has(key)) {
      indexes.set(key, values.length + 1);
      values.push(params[key]);
    }
    return `$${indexes.get(key)}`;
  });

  return { text, values };
}

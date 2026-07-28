import { Pool } from "pg";

/**
 * Single shared pg Pool. In Next.js dev the module can be re-evaluated on hot
 * reload, so we cache the pool on globalThis to avoid exhausting connections.
 */
const globalForDb = globalThis as unknown as { _pgPool?: Pool };

export const pool: Pool =
  globalForDb._pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://calc:calc@localhost:5432/margin_calculator",
    // Keep the pool small — this is a read-mostly reference service.
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb._pgPool = pool;

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

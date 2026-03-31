import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "WARNING: DATABASE_URL is not set. Database queries will fail until it is provided.",
  );
}

// Cloud-hosted Postgres (Neon, Supabase, Railway, etc.) requires SSL.
// rejectUnauthorized: false allows self-signed certs used by many providers.
const isLocal =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "",
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export * from "./schema";

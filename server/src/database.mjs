import pg from "pg";

const { Pool } = pg;

export function createDatabasePool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 4_000,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : undefined,
  });
}

import { createClient } from "@libsql/client";

const globalForLibsql = globalThis as unknown as {
  libsql: ReturnType<typeof createClient> | undefined;
};

// Create libsql client for Turso (used for all database operations)
export const libsql = globalForLibsql.libsql ?? createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN,
});

if (process.env.NODE_ENV !== "production") globalForLibsql.libsql = libsql;


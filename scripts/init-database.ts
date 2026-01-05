import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  const databaseToken = process.env.DATABASE_TOKEN;

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  if (!databaseToken) {
    console.error("Error: DATABASE_TOKEN environment variable is not set");
    process.exit(1);
  }

  console.log("Connecting to Turso database...");
  const client = createClient({
    url: databaseUrl,
    authToken: databaseToken,
  });

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), "scripts", "init-turso-schema.sql");
  let sql = fs.readFileSync(sqlPath, "utf-8");

  // Remove comments
  sql = sql.replace(/--.*$/gm, "");

  // Split SQL into individual statements by semicolon
  const allStatements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Separate CREATE TABLE and CREATE INDEX statements
  const tableStatements = allStatements.filter((s) =>
    s.toUpperCase().startsWith("CREATE TABLE")
  );
  const indexStatements = allStatements.filter((s) =>
    s.toUpperCase().startsWith("CREATE INDEX")
  );

  console.log(`Found ${tableStatements.length} table(s) and ${indexStatements.length} index(es) to create...\n`);

  try {
    // Execute table creation statements first (in order)
    console.log("Creating tables...");
    for (const statement of tableStatements) {
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] || "unknown";
      await client.execute(statement + ";");
      console.log(`✓ Created table: ${tableName}`);
    }

    // Execute index creation statements after tables are created
    if (indexStatements.length > 0) {
      console.log(`\nCreating indexes...`);
      for (const statement of indexStatements) {
        const tableName = statement.match(/ON "(\w+)"/)?.[1] || "unknown";
        await client.execute(statement + ";");
        console.log(`✓ Created index on: ${tableName}`);
      }
    }

    console.log("\n✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

initDatabase();


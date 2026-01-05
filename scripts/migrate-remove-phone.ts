import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";

async function migrateDatabase() {
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
  const sqlPath = path.join(process.cwd(), "scripts", "migrate-remove-phone.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Remove comments
  let cleanSql = sql.replace(/--.*$/gm, "");

  // Split SQL into individual statements
  const statements = cleanSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} migration statements...\n`);

  try {
    for (const statement of statements) {
      if (statement.trim()) {
        await client.execute(statement + ";");
        console.log("✓ Executed:", statement.substring(0, 80) + "...");
      }
    }
    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error running migration:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

migrateDatabase();


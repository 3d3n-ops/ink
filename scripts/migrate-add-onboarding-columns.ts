/**
 * Migration script to add writingIdentity and writingFrequency columns to UserPreferences
 * Run with: bun run tsx scripts/migrate-add-onboarding-columns.ts
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });
config({ path: ".env" });

const statements = [
  // Add writingIdentity column (Which feels closest right now?)
  `ALTER TABLE UserPreferences ADD COLUMN writingIdentity TEXT`,
  
  // Add writingFrequency column (How often do you want to write?)
  `ALTER TABLE UserPreferences ADD COLUMN writingFrequency TEXT`,
];

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_TOKEN;

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is required");
    console.error("Make sure your .env.local file is loaded");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  try {
    console.log(`\nAdding onboarding columns to UserPreferences...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.replace(/\s+/g, " ").trim();
      console.log(`[${i + 1}/${statements.length}] ${preview}`);
      
      try {
        await client.execute(statement);
        console.log(`    ✅ Success\n`);
      } catch (error: any) {
        // Check if column already exists (SQLite duplicate column error)
        if (error.message?.includes("duplicate column name")) {
          console.log(`    ⚠️  Column already exists, skipping\n`);
        } else {
          throw error;
        }
      }
    }

    console.log("✅ Migration completed successfully!");

    // Verify columns exist
    const result = await client.execute(
      "PRAGMA table_info(UserPreferences)"
    );
    console.log("\nUserPreferences columns:");
    result.rows.forEach((row) => console.log(`  - ${row.name} (${row.type})`));

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

migrate();

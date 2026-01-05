/**
 * Migration script to add WritingPrompt and PromptGenerationJob tables
 * Run with: npx tsx scripts/migrate-add-prompts.ts
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });
config({ path: ".env" });

// Define SQL statements individually to avoid parsing issues
const statements = [
  // Table: WritingPrompt
  `CREATE TABLE IF NOT EXISTS WritingPrompt (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    interest TEXT NOT NULL,
    hook TEXT NOT NULL,
    blurb TEXT NOT NULL,
    imageUrl TEXT,
    tags TEXT DEFAULT '[]',
    suggestedAngles TEXT DEFAULT '[]',
    sources TEXT DEFAULT '[]',
    artStyle TEXT,
    status TEXT DEFAULT 'pending',
    usedAt TEXT,
    dismissedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`,

  // Table: PromptGenerationJob
  `CREATE TABLE IF NOT EXISTS PromptGenerationJob (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    selectedInterests TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error TEXT,
    researchCompleted INTEGER DEFAULT 0,
    compositionCompleted INTEGER DEFAULT 0,
    visualsCompleted INTEGER DEFAULT 0,
    startedAt TEXT,
    completedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_writing_prompt_user ON WritingPrompt(userId)`,
  `CREATE INDEX IF NOT EXISTS idx_writing_prompt_status ON WritingPrompt(status)`,
  `CREATE INDEX IF NOT EXISTS idx_writing_prompt_created ON WritingPrompt(createdAt DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_prompt_job_user ON PromptGenerationJob(userId)`,
  `CREATE INDEX IF NOT EXISTS idx_prompt_job_status ON PromptGenerationJob(status)`,
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
    console.log(`Executing ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.replace(/\s+/g, " ").substring(0, 60);
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      await client.execute(statement);
    }

    console.log("\n✅ Migration completed successfully!");

    // Verify tables exist
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('WritingPrompt', 'PromptGenerationJob')"
    );
    console.log("\nCreated tables:");
    tables.rows.forEach((row) => console.log(`  - ${row.name}`));

    // Show indexes
    const indexes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%prompt%'"
    );
    console.log("\nCreated indexes:");
    indexes.rows.forEach((row) => console.log(`  - ${row.name}`));
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

migrate();

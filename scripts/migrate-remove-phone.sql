-- Migration: Remove phone number columns from UserPreferences table
-- Run using: bun run scripts/migrate-remove-phone.ts

-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- This migration will:
-- 1. Create a new table without phone columns
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- Create temporary table without phone columns
CREATE TABLE IF NOT EXISTS "UserPreferences_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "writingReason" TEXT,
    "interests" TEXT NOT NULL DEFAULT '[]',
    "writingLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table (excluding phone columns)
INSERT INTO "UserPreferences_new" (id, userId, writingReason, interests, writingLevel, createdAt, updatedAt)
SELECT id, userId, writingReason, interests, writingLevel, createdAt, updatedAt
FROM "UserPreferences";

-- Drop old table
DROP TABLE IF EXISTS "UserPreferences";

-- Rename new table
ALTER TABLE "UserPreferences_new" RENAME TO "UserPreferences";

-- Recreate index
CREATE INDEX IF NOT EXISTS "UserPreferences_userId_idx" ON "UserPreferences"("userId");


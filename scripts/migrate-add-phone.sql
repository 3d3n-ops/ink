-- Migration: Add phone number fields to UserPreferences table
-- Run using: bun run scripts/migrate-add-phone.ts

-- Add phoneNumber column if it doesn't exist
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;

-- Add phoneVerified column if it doesn't exist
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "phoneVerified" INTEGER NOT NULL DEFAULT 0;


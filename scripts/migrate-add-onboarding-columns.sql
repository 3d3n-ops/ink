-- Migration: Add writingIdentity and writingFrequency columns to UserPreferences
-- Run with: bun run tsx scripts/migrate-add-onboarding-columns.ts

-- Add writingIdentity column (Which feels closest right now?)
ALTER TABLE UserPreferences ADD COLUMN writingIdentity TEXT;

-- Add writingFrequency column (How often do you want to write?)
ALTER TABLE UserPreferences ADD COLUMN writingFrequency TEXT;

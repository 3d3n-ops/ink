-- Migration: Add Writing Prompts and Generation Jobs tables
-- Run this migration to enable the prompt recommendation engine

-- Writing prompts generated for users
CREATE TABLE IF NOT EXISTS WritingPrompt (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  
  -- Content
  interest TEXT NOT NULL,
  hook TEXT NOT NULL,
  blurb TEXT NOT NULL,
  imageUrl TEXT,
  
  -- Metadata (stored as JSON strings)
  tags TEXT DEFAULT '[]',
  suggestedAngles TEXT DEFAULT '[]',
  sources TEXT DEFAULT '[]',
  artStyle TEXT,
  
  -- Status: pending, generating, ready, used, dismissed, failed
  status TEXT DEFAULT 'pending',
  usedAt TEXT,
  dismissedAt TEXT,
  
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Job tracking for prompt generation
CREATE TABLE IF NOT EXISTS PromptGenerationJob (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  
  -- Job details (selectedInterests stored as JSON array)
  selectedInterests TEXT NOT NULL,
  
  -- Status: pending, processing, completed, failed, cancelled
  status TEXT DEFAULT 'pending',
  error TEXT,
  
  -- Progress tracking
  researchCompleted INTEGER DEFAULT 0,
  compositionCompleted INTEGER DEFAULT 0,
  visualsCompleted INTEGER DEFAULT 0,
  
  startedAt TEXT,
  completedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_writing_prompt_user ON WritingPrompt(userId);
CREATE INDEX IF NOT EXISTS idx_writing_prompt_status ON WritingPrompt(status);
CREATE INDEX IF NOT EXISTS idx_writing_prompt_created ON WritingPrompt(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_job_user ON PromptGenerationJob(userId);
CREATE INDEX IF NOT EXISTS idx_prompt_job_status ON PromptGenerationJob(status);


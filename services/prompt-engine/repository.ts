/**
 * Prompt Repository
 * Database operations for writing prompts and generation jobs
 */

import { libsql } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import type {
  WritingPrompt,
  PromptGenerationJob,
  JobStatus,
  PromptStatus,
  ResearchSource,
  ArtStyle,
} from './types';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Parse JSON safely
 */
function safeParseJson<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================================================
// Writing Prompt Operations
// ============================================================================

export async function createWritingPrompt(data: {
  userId: string;
  interest: string;
  hook: string;
  blurb: string;
  imageUrl?: string | null;
  tags?: string[];
  suggestedAngles?: string[];
  sources?: ResearchSource[];
  artStyle?: ArtStyle | null;
  status?: PromptStatus;
}): Promise<WritingPrompt> {
  const id = generateId();
  const now = new Date().toISOString();

  await libsql.execute({
    sql: `INSERT INTO WritingPrompt (
      id, userId, interest, hook, blurb, imageUrl,
      tags, suggestedAngles, sources, artStyle, status,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.userId,
      data.interest,
      data.hook,
      data.blurb,
      data.imageUrl || null,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.suggestedAngles || []),
      JSON.stringify(data.sources || []),
      data.artStyle || null,
      data.status || 'ready',
      now,
      now,
    ],
  });

  return {
    id,
    userId: data.userId,
    interest: data.interest,
    hook: data.hook,
    blurb: data.blurb,
    imageUrl: data.imageUrl || null,
    tags: data.tags || [],
    suggestedAngles: data.suggestedAngles || [],
    sources: data.sources || [],
    artStyle: data.artStyle || null,
    status: data.status || 'ready',
    usedAt: null,
    dismissedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getWritingPromptById(id: string): Promise<WritingPrompt | null> {
  const result = await libsql.execute({
    sql: 'SELECT * FROM WritingPrompt WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return rowToWritingPrompt(result.rows[0]);
}

export async function getWritingPromptsForUser(
  userId: string,
  options: {
    status?: PromptStatus | PromptStatus[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<WritingPrompt[]> {
  const { status, limit = 10, offset = 0 } = options;

  let sql = 'SELECT * FROM WritingPrompt WHERE userId = ?';
  const args: (string | number)[] = [userId];

  if (status) {
    if (Array.isArray(status)) {
      sql += ` AND status IN (${status.map(() => '?').join(', ')})`;
      args.push(...status);
    } else {
      sql += ' AND status = ?';
      args.push(status);
    }
  }

  sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const result = await libsql.execute({ sql, args });
  return result.rows.map(rowToWritingPrompt);
}

export async function updateWritingPromptStatus(
  id: string,
  status: PromptStatus
): Promise<void> {
  const now = new Date().toISOString();
  const updates: string[] = ['status = ?', 'updatedAt = ?'];
  const args: (string | null)[] = [status, now];

  if (status === 'used') {
    updates.push('usedAt = ?');
    args.push(now);
  } else if (status === 'dismissed') {
    updates.push('dismissedAt = ?');
    args.push(now);
  }

  args.push(id);

  await libsql.execute({
    sql: `UPDATE WritingPrompt SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });
}

export async function deleteWritingPrompt(id: string): Promise<void> {
  await libsql.execute({
    sql: 'DELETE FROM WritingPrompt WHERE id = ?',
    args: [id],
  });
}

function rowToWritingPrompt(row: Record<string, unknown>): WritingPrompt {
  return {
    id: row.id as string,
    userId: row.userId as string,
    interest: row.interest as string,
    hook: row.hook as string,
    blurb: row.blurb as string,
    imageUrl: row.imageUrl as string | null,
    tags: safeParseJson(row.tags as string, []),
    suggestedAngles: safeParseJson(row.suggestedAngles as string, []),
    sources: safeParseJson(row.sources as string, []),
    artStyle: row.artStyle as ArtStyle | null,
    status: row.status as PromptStatus,
    usedAt: row.usedAt as string | null,
    dismissedAt: row.dismissedAt as string | null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

// ============================================================================
// Job Operations
// ============================================================================

export async function createPromptGenerationJob(data: {
  userId: string;
  selectedInterests: string[];
}): Promise<PromptGenerationJob> {
  const id = generateId();
  const now = new Date().toISOString();

  await libsql.execute({
    sql: `INSERT INTO PromptGenerationJob (
      id, userId, selectedInterests, status, createdAt
    ) VALUES (?, ?, ?, ?, ?)`,
    args: [
      id,
      data.userId,
      JSON.stringify(data.selectedInterests),
      'pending',
      now,
    ],
  });

  return {
    id,
    userId: data.userId,
    selectedInterests: data.selectedInterests,
    status: 'pending',
    error: null,
    researchCompleted: 0,
    compositionCompleted: 0,
    visualsCompleted: 0,
    startedAt: null,
    completedAt: null,
    createdAt: now,
  };
}

export async function getJobById(id: string): Promise<PromptGenerationJob | null> {
  const result = await libsql.execute({
    sql: 'SELECT * FROM PromptGenerationJob WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return rowToJob(result.rows[0]);
}

export async function getActiveJobForUser(userId: string): Promise<PromptGenerationJob | null> {
  const result = await libsql.execute({
    sql: `SELECT * FROM PromptGenerationJob 
          WHERE userId = ? AND status IN ('pending', 'processing')
          ORDER BY createdAt DESC LIMIT 1`,
    args: [userId],
  });

  if (result.rows.length === 0) return null;
  return rowToJob(result.rows[0]);
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  error?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const updates: string[] = ['status = ?'];
  const args: (string | null)[] = [status];

  if (status === 'processing') {
    updates.push('startedAt = ?');
    args.push(now);
  } else if (status === 'completed' || status === 'failed') {
    updates.push('completedAt = ?');
    args.push(now);
  }

  if (error !== undefined) {
    updates.push('error = ?');
    args.push(error);
  }

  args.push(id);

  await libsql.execute({
    sql: `UPDATE PromptGenerationJob SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });
}

export async function updateJobProgress(
  id: string,
  progress: {
    researchCompleted?: number;
    compositionCompleted?: number;
    visualsCompleted?: number;
  }
): Promise<void> {
  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (progress.researchCompleted !== undefined) {
    updates.push('researchCompleted = ?');
    args.push(progress.researchCompleted);
  }
  if (progress.compositionCompleted !== undefined) {
    updates.push('compositionCompleted = ?');
    args.push(progress.compositionCompleted);
  }
  if (progress.visualsCompleted !== undefined) {
    updates.push('visualsCompleted = ?');
    args.push(progress.visualsCompleted);
  }

  if (updates.length === 0) return;

  args.push(id);

  await libsql.execute({
    sql: `UPDATE PromptGenerationJob SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });
}

function rowToJob(row: Record<string, unknown>): PromptGenerationJob {
  return {
    id: row.id as string,
    userId: row.userId as string,
    selectedInterests: safeParseJson(row.selectedInterests as string, []),
    status: row.status as JobStatus,
    error: row.error as string | null,
    researchCompleted: (row.researchCompleted as number) || 0,
    compositionCompleted: (row.compositionCompleted as number) || 0,
    visualsCompleted: (row.visualsCompleted as number) || 0,
    startedAt: row.startedAt as string | null,
    completedAt: row.completedAt as string | null,
    createdAt: row.createdAt as string,
  };
}

// ============================================================================
// User Preferences
// ============================================================================

export async function getUserPreferences(userId: string): Promise<{
  interests: string[];
  writingReason: string | null;
  writingLevel: string | null;
} | null> {
  // First get the internal user ID from clerk ID
  const userResult = await libsql.execute({
    sql: 'SELECT id FROM User WHERE clerkId = ?',
    args: [userId],
  });

  if (userResult.rows.length === 0) return null;
  const internalUserId = userResult.rows[0].id as string;

  const result = await libsql.execute({
    sql: 'SELECT interests, writingReason, writingLevel FROM UserPreferences WHERE userId = ?',
    args: [internalUserId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    interests: safeParseJson(row.interests as string, []),
    writingReason: row.writingReason as string | null,
    writingLevel: row.writingLevel as string | null,
  };
}

export async function getInternalUserId(clerkId: string): Promise<string | null> {
  const result = await libsql.execute({
    sql: 'SELECT id FROM User WHERE clerkId = ?',
    args: [clerkId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0].id as string;
}

// ============================================================================
// Daily Generation Tracking
// ============================================================================

/**
 * Check if user has had prompts generated today
 */
export async function hasGeneratedToday(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const result = await libsql.execute({
    sql: `SELECT COUNT(*) as count FROM PromptGenerationJob 
          WHERE userId = ? AND createdAt >= ? AND status IN ('pending', 'processing', 'completed')`,
    args: [userId, todayStr],
  });

  const count = (result.rows[0]?.count as number) || 0;
  return count > 0;
}

/**
 * Get last generation date for a user
 */
export async function getLastGenerationDate(userId: string): Promise<string | null> {
  const result = await libsql.execute({
    sql: `SELECT createdAt FROM PromptGenerationJob 
          WHERE userId = ? AND status = 'completed'
          ORDER BY createdAt DESC LIMIT 1`,
    args: [userId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0].createdAt as string;
}

/**
 * Get all users who need daily prompts
 * (Users with preferences who haven't had prompts generated today)
 */
export async function getUsersNeedingDailyPrompts(): Promise<string[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // Get all users with preferences who don't have a job created today
  const result = await libsql.execute({
    sql: `SELECT DISTINCT u.clerkId 
          FROM User u
          INNER JOIN UserPreferences up ON u.id = up.userId
          WHERE u.id NOT IN (
            SELECT userId FROM PromptGenerationJob 
            WHERE createdAt >= ? AND status IN ('pending', 'processing', 'completed')
          )`,
    args: [todayStr],
  });

  return result.rows.map(row => row.clerkId as string);
}

/**
 * Count ready prompts for user
 */
export async function countReadyPrompts(userId: string): Promise<number> {
  const result = await libsql.execute({
    sql: `SELECT COUNT(*) as count FROM WritingPrompt WHERE userId = ? AND status = 'ready'`,
    args: [userId],
  });

  return (result.rows[0]?.count as number) || 0;
}


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { libsql } from "@/lib/prisma";
import { entriesCache, cacheKeys } from "@/lib/cache";
import { randomBytes } from "crypto";

// Helper to generate CUID-like ID
function generateId(): string {
  return randomBytes(16).toString("hex");
}

// POST - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title: rawTitle, slug: rawSlug, content } = body;

    // Validate required fields
    if (!rawTitle?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!rawSlug?.trim()) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Normalize inputs early to ensure consistency
    const title = rawTitle.trim();
    const slug = rawSlug.trim();

    // Find or create user
    let userResult = await libsql.execute({
      sql: "SELECT id FROM User WHERE clerkId = ?",
      args: [userId],
    });

    let userId_db: string;
    if (userResult.rows.length === 0) {
      userId_db = generateId();
      const now = new Date().toISOString();
      await libsql.execute({
        sql: "INSERT INTO User (id, clerkId, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
        args: [userId_db, userId, now, now],
      });
    } else {
      userId_db = userResult.rows[0].id as string;
    }

    // Check if slug already exists for this user
    const existingEntry = await libsql.execute({
      sql: "SELECT id FROM JournalEntry WHERE userId = ? AND slug = ?",
      args: [userId_db, slug],
    });

    if (existingEntry.rows.length > 0) {
      return NextResponse.json(
        { error: "A post with this URL already exists. Please choose a different slug." },
        { status: 400 }
      );
    }

    // Create the journal entry
    const entryId = generateId();
    const now = new Date().toISOString();

    await libsql.execute({
      sql: `INSERT INTO JournalEntry (id, userId, title, slug, content, isPublished, publishedAt, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        entryId,
        userId_db,
        title,
        slug,
        content,
        1, // isPublished = true
        now, // publishedAt
        now,
        now,
      ],
    });

    // Invalidate the entries cache for this user
    entriesCache.invalidate(cacheKeys.userEntries(userId));

    return NextResponse.json({ 
      success: true, 
      entry: {
        id: entryId,
        slug,
      }
    });
  } catch (error) {
    console.error("Error creating entry:", error);
    return NextResponse.json(
      { error: "Failed to save entry" },
      { status: 500 }
    );
  }
}

// Entry type for caching
interface CachedEntry {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET - Fetch all entries for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check cache first
    const cacheKey = cacheKeys.userEntries(userId);
    const cachedEntries = entriesCache.get<CachedEntry[]>(cacheKey);
    
    if (cachedEntries) {
      return NextResponse.json({ entries: cachedEntries });
    }

    // Find user
    const userResult = await libsql.execute({
      sql: "SELECT id FROM User WHERE clerkId = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      // Cache empty result too
      entriesCache.set(cacheKey, []);
      return NextResponse.json({ entries: [] });
    }

    const userId_db = userResult.rows[0].id as string;

    // Fetch entries
    const entriesResult = await libsql.execute({
      sql: `SELECT id, title, slug, isPublished, publishedAt, createdAt, updatedAt 
            FROM JournalEntry 
            WHERE userId = ? 
            ORDER BY createdAt DESC`,
      args: [userId_db],
    });

    const entries: CachedEntry[] = entriesResult.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      isPublished: Boolean(row.isPublished),
      publishedAt: row.publishedAt as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    // Cache the result
    entriesCache.set(cacheKey, entries);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}


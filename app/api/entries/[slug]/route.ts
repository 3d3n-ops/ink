import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { libsql } from "@/lib/prisma";
import { entriesCache, cacheKeys } from "@/lib/cache";

type RouteContext = { params: Promise<{ slug: string }> };

// Entry type for caching
interface CachedSingleEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET - Fetch a single entry by slug for the current user
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = cacheKeys.singleEntry(userId, slug);
    const cachedEntry = entriesCache.get<CachedSingleEntry>(cacheKey);
    
    if (cachedEntry) {
      return NextResponse.json({ entry: cachedEntry });
    }

    // Find user
    const userResult = await libsql.execute({
      sql: "SELECT id FROM User WHERE clerkId = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const userId_db = userResult.rows[0].id as string;

    // Fetch the entry
    const entryResult = await libsql.execute({
      sql: `SELECT id, title, slug, content, isPublished, publishedAt, createdAt, updatedAt 
            FROM JournalEntry 
            WHERE userId = ? AND slug = ?`,
      args: [userId_db, slug],
    });

    if (entryResult.rows.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const row = entryResult.rows[0];
    const entry: CachedSingleEntry = {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      content: row.content as string,
      isPublished: Boolean(row.isPublished),
      publishedAt: row.publishedAt as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };

    // Cache the result
    entriesCache.set(cacheKey, entry);

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error fetching entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing entry by slug
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title: rawTitle, slug: newSlug, content } = body;

    // Validate required fields
    if (!rawTitle?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const title = rawTitle.trim();
    const updatedSlug = newSlug?.trim() || slug;

    // Find user
    const userResult = await libsql.execute({
      sql: "SELECT id FROM User WHERE clerkId = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const userId_db = userResult.rows[0].id as string;

    // Check if the entry exists
    const existingEntry = await libsql.execute({
      sql: "SELECT id FROM JournalEntry WHERE userId = ? AND slug = ?",
      args: [userId_db, slug],
    });

    if (existingEntry.rows.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const entryId = existingEntry.rows[0].id as string;

    // If slug is changing, check if new slug already exists
    if (updatedSlug !== slug) {
      const slugCheck = await libsql.execute({
        sql: "SELECT id FROM JournalEntry WHERE userId = ? AND slug = ? AND id != ?",
        args: [userId_db, updatedSlug, entryId],
      });

      if (slugCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "A post with this URL already exists. Please choose a different slug." },
          { status: 400 }
        );
      }
    }

    // Update the entry
    const now = new Date().toISOString();

    await libsql.execute({
      sql: `UPDATE JournalEntry 
            SET title = ?, slug = ?, content = ?, updatedAt = ?
            WHERE id = ?`,
      args: [title, updatedSlug, content, now, entryId],
    });

    // Invalidate caches
    entriesCache.invalidate(cacheKeys.userEntries(userId)); // Invalidate entries list
    entriesCache.invalidate(cacheKeys.singleEntry(userId, slug)); // Invalidate old slug
    if (updatedSlug !== slug) {
      entriesCache.invalidate(cacheKeys.singleEntry(userId, updatedSlug)); // Invalidate new slug too
    }

    return NextResponse.json({ 
      success: true, 
      entry: {
        id: entryId,
        slug: updatedSlug,
      }
    });
  } catch (error) {
    console.error("Error updating entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}


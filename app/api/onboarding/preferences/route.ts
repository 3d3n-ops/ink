import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { libsql } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Helper to generate CUID-like ID
function generateId(): string {
  return randomBytes(16).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clerkId, writingReason, interests, writingLevel } = body;

    // Verify the clerkId matches the authenticated user
    if (clerkId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Check if preferences exist
    const preferencesResult = await libsql.execute({
      sql: "SELECT id FROM UserPreferences WHERE userId = ?",
      args: [userId_db],
    });

    // Prepare update data
    const updates: string[] = [];
    const updateArgs: any[] = [];

    if (writingReason !== undefined) {
      updates.push("writingReason = ?");
      updateArgs.push(writingReason);
    }
    if (interests !== undefined) {
      updates.push("interests = ?");
      updateArgs.push(JSON.stringify(interests));
    }
    if (writingLevel !== undefined) {
      updates.push("writingLevel = ?");
      updateArgs.push(writingLevel);
    }

    const now = new Date().toISOString();

    if (preferencesResult.rows.length === 0) {
      // Create new preferences
      const prefId = generateId();
      await libsql.execute({
        sql: `INSERT INTO UserPreferences (id, userId, writingReason, interests, writingLevel, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          prefId,
          userId_db,
          writingReason || null,
          interests ? JSON.stringify(interests) : JSON.stringify([]),
          writingLevel || null,
          now,
          now,
        ],
      });
    } else if (updates.length > 0) {
      // Update existing preferences
      updateArgs.push(now, userId_db);
      await libsql.execute({
        sql: `UPDATE UserPreferences SET ${updates.join(", ")}, updatedAt = ? WHERE userId = ?`,
        args: updateArgs,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { libsql } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info from Clerk
    const user = await currentUser();
    const userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || "User";

    // Find user in database
    const userResult = await libsql.execute({
      sql: "SELECT id FROM User WHERE clerkId = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        name: userName,
        interests: [],
        activityGraph: [],
        insights: {
          totalEntries: 0,
          totalWords: 0,
          avgWordsPerEntry: 0,
          avgTimeSpent: 0,
          mostWordsWritten: 0,
          longestStreak: 0,
        },
      });
    }

    const userId_db = userResult.rows[0].id as string;

    // Get user preferences (interests)
    const preferencesResult = await libsql.execute({
      sql: "SELECT interests FROM UserPreferences WHERE userId = ?",
      args: [userId_db],
    });

    let interests: string[] = [];
    if (preferencesResult.rows.length > 0 && preferencesResult.rows[0].interests) {
      try {
        interests = JSON.parse(preferencesResult.rows[0].interests as string);
      } catch {
        interests = [];
      }
    }

    // Get all entries for stats and activity graph
    const entriesResult = await libsql.execute({
      sql: `SELECT 
              id, 
              title, 
              content, 
              createdAt, 
              updatedAt
            FROM JournalEntry 
            WHERE userId = ? 
            ORDER BY createdAt ASC`,
      args: [userId_db],
    });

    const entries = entriesResult.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    // Calculate insights
    const totalEntries = entries.length;
    
    // Calculate word counts (strip HTML tags for word count)
    const wordCounts = entries.map((entry) => {
      const textContent = entry.content.replace(/<[^>]*>/g, " ").trim();
      return textContent.split(/\s+/).filter((word) => word.length > 0).length;
    });

    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    const mostWordsWritten = wordCounts.length > 0 ? Math.max(...wordCounts) : 0;

    // Calculate average time spent (estimate based on word count: ~200 words per minute)
    const avgTimeSpent = totalEntries > 0 
      ? Math.round((totalWords / 200) / totalEntries) 
      : 0;

    // Calculate activity graph (last 365 days, GitHub-style)
    const activityGraph: { date: string; count: number }[] = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // Group entries by date
    const entriesByDate = new Map<string, number>();
    entries.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= oneYearAgo) {
        const dateKey = entryDate.toISOString().split("T")[0];
        entriesByDate.set(dateKey, (entriesByDate.get(dateKey) || 0) + 1);
      }
    });

    // Generate graph data for last 365 days
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      activityGraph.push({
        date: dateKey,
        count: entriesByDate.get(dateKey) || 0,
      });
    }

    // Calculate longest streak
    let longestStreak = 0;
    let currentStreak = 0;
    const sortedDates = Array.from(entriesByDate.keys()).sort();
    
    if (sortedDates.length > 0) {
      let prevDate = new Date(sortedDates[0]);
      currentStreak = 1;
      longestStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const daysDiff = Math.floor(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }

        prevDate = currentDate;
      }
    }

    return NextResponse.json({
      name: userName,
      interests,
      activityGraph,
      insights: {
        totalEntries,
        totalWords,
        avgWordsPerEntry,
        avgTimeSpent,
        mostWordsWritten,
        longestStreak,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

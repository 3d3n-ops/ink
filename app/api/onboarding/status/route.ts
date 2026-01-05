import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { libsql } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists and has preferences
    const result = await libsql.execute({
      sql: `
        SELECT up.id, up.interests 
        FROM User u 
        LEFT JOIN UserPreferences up ON u.id = up.userId 
        WHERE u.clerkId = ?
      `,
      args: [userId],
    });

    if (result.rows.length === 0) {
      // User doesn't exist yet - needs onboarding
      return NextResponse.json({ completed: false, reason: "no_user" });
    }

    const preferences = result.rows[0];
    
    // Check if preferences exist and interests are filled
    if (!preferences.id || !preferences.interests) {
      return NextResponse.json({ completed: false, reason: "no_preferences" });
    }

    // Check if interests array is not empty
    try {
      const interests = JSON.parse(preferences.interests as string);
      if (!Array.isArray(interests) || interests.length === 0) {
        return NextResponse.json({ completed: false, reason: "empty_interests" });
      }
    } catch {
      return NextResponse.json({ completed: false, reason: "invalid_interests" });
    }

    return NextResponse.json({ completed: true });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}


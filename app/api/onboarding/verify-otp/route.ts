import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyOTP } from "@/lib/otp";
import { libsql } from "@/lib/prisma";
import { randomBytes } from "crypto";

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
    const { clerkId, otp } = body;

    // Verify the clerkId matches the authenticated user
    if (clerkId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { error: "Invalid OTP format" },
        { status: 400 }
      );
    }

    // Verify OTP
    const verification = verifyOTP(userId, otp);

    if (!verification.valid || !verification.phoneNumber) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
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

    const now = new Date().toISOString();

    if (preferencesResult.rows.length === 0) {
      // Create new preferences with phone number
      const prefId = generateId();
      await libsql.execute({
        sql: `INSERT INTO UserPreferences (id, userId, phoneNumber, phoneVerified, interests, createdAt, updatedAt) 
              VALUES (?, ?, ?, 1, ?, ?, ?)`,
        args: [
          prefId,
          userId_db,
          verification.phoneNumber,
          JSON.stringify([]),
          now,
          now,
        ],
      });
    } else {
      // Update existing preferences with phone number and verification status
      await libsql.execute({
        sql: `UPDATE UserPreferences 
              SET phoneNumber = ?, phoneVerified = 1, updatedAt = ? 
              WHERE userId = ?`,
        args: [verification.phoneNumber, now, userId_db],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}


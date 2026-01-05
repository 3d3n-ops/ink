import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storeOTP } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clerkId, phoneNumber } = body;

    // Verify the clerkId matches the authenticated user
    if (clerkId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Generate and store OTP
    const otpCode = storeOTP(userId, phoneNumber);

    // In production, send OTP via SMS service (Twilio, etc.)
    // For now, we'll log it (remove this in production!)
    console.log(`OTP for ${phoneNumber}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Remove this in production - only for development
      otp: process.env.NODE_ENV === "development" ? otpCode : undefined,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}


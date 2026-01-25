/**
 * API Route to manually trigger prompt generation
 * POST /api/prompts/trigger - Trigger prompt generation for current user
 * POST /api/prompts/trigger?clerkUserId=xxx - Trigger for specific user (admin/debug)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPromptOrchestrator } from "@/services/prompt-engine/orchestrator";
import * as repository from "@/services/prompt-engine/repository";

/**
 * POST /api/prompts/trigger
 * Manually trigger prompt generation
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if a specific clerkUserId is provided in query params (for admin/debug)
    const searchParams = request.nextUrl.searchParams;
    const targetClerkUserId = searchParams.get("clerkUserId");

    // Use target user if provided, otherwise use authenticated user
    const userIdToUse = targetClerkUserId || clerkUserId;

    // If using a different user, verify it exists (basic check)
    if (targetClerkUserId && targetClerkUserId !== clerkUserId) {
      const targetUser = await repository.getInternalUserId(targetClerkUserId);
      if (!targetUser) {
        return NextResponse.json(
          { error: "Target user not found" },
          { status: 404 }
        );
      }
    }

    const orchestrator = getPromptOrchestrator();

    // Start generation (returns immediately, processing happens in background)
    const job = await orchestrator.generatePrompts(userIdToUse);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Prompt generation started",
      status: job.status,
      userId: userIdToUse,
    });
  } catch (error) {
    console.error("Error starting prompt generation:", error);

    const message =
      error instanceof Error ? error.message : "Failed to start generation";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

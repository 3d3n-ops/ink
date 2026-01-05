/**
 * API Route to refresh/regenerate prompts
 * POST /api/prompts/refresh - Request new prompt generation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPromptOrchestrator } from "@/services/prompt-engine/orchestrator";
import * as repository from "@/services/prompt-engine/repository";
import { RATE_LIMIT_CONFIG } from "@/services/prompt-engine/config";

/**
 * POST /api/prompts/refresh
 * Triggers regeneration of prompts for the current user
 * Subject to rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get internal user ID
    const userId = await repository.getInternalUserId(clerkUserId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing active job
    const existingJob = await repository.getActiveJobForUser(userId);
    if (existingJob) {
      return NextResponse.json(
        {
          error: "Generation already in progress",
          jobId: existingJob.id,
        },
        { status: 429 }
      );
    }

    // TODO: Add rate limiting check
    // Check if user has requested refresh too recently
    // For now, we'll allow refreshes

    const orchestrator = getPromptOrchestrator();
    const job = await orchestrator.regeneratePrompts(clerkUserId);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Regenerating prompts",
    });
  } catch (error) {
    console.error("Error refreshing prompts:", error);

    const message =
      error instanceof Error ? error.message : "Failed to refresh prompts";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}


/**
 * API Routes for Writing Prompts
 * GET /api/prompts - Get ready prompts for the current user
 * POST /api/prompts - Trigger prompt generation (usually after onboarding)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPromptOrchestrator } from "@/services/prompt-engine/orchestrator";
import * as repository from "@/services/prompt-engine/repository";

/**
 * GET /api/prompts
 * Returns ready prompts for the current user
 */
export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Parse status - supports comma-separated values like "ready,used"
    let status: "ready" | "used" | "dismissed" | ("ready" | "used" | "dismissed")[] | undefined;
    if (statusParam) {
      const statuses = statusParam.split(",").map(s => s.trim()) as ("ready" | "used" | "dismissed")[];
      status = statuses.length === 1 ? statuses[0] : statuses;
    }

    // Get prompts
    const prompts = await repository.getWritingPromptsForUser(userId, {
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      prompts,
      hasMore: prompts.length === limit,
    });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts
 * Triggers prompt generation for the current user
 * Call this after onboarding completion
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orchestrator = getPromptOrchestrator();

    // Start generation (returns immediately, processing happens in background)
    const job = await orchestrator.generatePrompts(clerkUserId);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Prompt generation started",
      status: job.status,
    });
  } catch (error) {
    console.error("Error starting prompt generation:", error);

    const message =
      error instanceof Error ? error.message : "Failed to start generation";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}


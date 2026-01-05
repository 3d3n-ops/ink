/**
 * API Route to dismiss a prompt
 * POST /api/prompts/:id/dismiss - Mark prompt as dismissed
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as repository from "@/services/prompt-engine/repository";

/**
 * POST /api/prompts/:id/dismiss
 * Marks a prompt as dismissed (user doesn't want to write about this)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const prompt = await repository.getWritingPromptById(id);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Verify ownership
    const userId = await repository.getInternalUserId(clerkUserId);
    if (prompt.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already dismissed or used
    if (prompt.status === "dismissed") {
      return NextResponse.json(
        { error: "Prompt already dismissed" },
        { status: 400 }
      );
    }

    if (prompt.status === "used") {
      return NextResponse.json(
        { error: "Cannot dismiss a used prompt" },
        { status: 400 }
      );
    }

    // Mark as dismissed
    await repository.updateWritingPromptStatus(id, "dismissed");

    return NextResponse.json({
      success: true,
      message: "Prompt dismissed",
    });
  } catch (error) {
    console.error("Error dismissing prompt:", error);
    return NextResponse.json(
      { error: "Failed to dismiss prompt" },
      { status: 500 }
    );
  }
}


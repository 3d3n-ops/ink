/**
 * API Route to mark a prompt as used
 * POST /api/prompts/:id/use - Mark prompt as used and return data for editor
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as repository from "@/services/prompt-engine/repository";

/**
 * POST /api/prompts/:id/use
 * Marks a prompt as used and returns data for the editor
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

    // Check if already used
    if (prompt.status === "used") {
      return NextResponse.json(
        { error: "Prompt already used" },
        { status: 400 }
      );
    }

    // Mark as used
    await repository.updateWritingPromptStatus(id, "used");

    // Return data formatted for the editor
    return NextResponse.json({
      success: true,
      prompt: {
        ...prompt,
        status: "used",
        usedAt: new Date().toISOString(),
      },
      editorData: {
        title: prompt.hook,
        blurb: prompt.blurb,
        imageUrl: prompt.imageUrl,
        tags: prompt.tags,
        interest: prompt.interest,
        suggestedAngles: prompt.suggestedAngles,
        sources: prompt.sources,
      },
    });
  } catch (error) {
    console.error("Error marking prompt as used:", error);
    return NextResponse.json(
      { error: "Failed to use prompt" },
      { status: 500 }
    );
  }
}


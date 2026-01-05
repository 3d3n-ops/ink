/**
 * API Route for job status
 * GET /api/prompts/job/:jobId - Get job status and progress
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPromptOrchestrator } from "@/services/prompt-engine/orchestrator";
import * as repository from "@/services/prompt-engine/repository";

/**
 * GET /api/prompts/job/:jobId
 * Returns job status and progress information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.getJobStatus(jobId);

    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    const userId = await repository.getInternalUserId(clerkUserId);
    if (result.job.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/job/:jobId
 * Cancels a running job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.getJobStatus(jobId);

    if (!result) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    const userId = await repository.getInternalUserId(clerkUserId);
    if (result.job.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only cancel pending or processing jobs
    if (!["pending", "processing"].includes(result.job.status)) {
      return NextResponse.json(
        { error: "Job cannot be cancelled" },
        { status: 400 }
      );
    }

    await orchestrator.cancelJob(jobId);

    return NextResponse.json({
      success: true,
      message: "Job cancelled",
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 }
    );
  }
}


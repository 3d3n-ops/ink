/**
 * Cron API Route for Daily Prompt Generation
 * 
 * This endpoint should be called by a cron service (like Vercel Cron, GitHub Actions, etc.)
 * to generate daily prompts for all users.
 * 
 * Schedule: Daily at 6:00 AM UTC
 * 
 * For Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-prompts",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getPromptOrchestrator } from "@/services/prompt-engine/orchestrator";

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // In development without a secret, allow access for testing
  if (!cronSecret && process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // CRON_SECRET must be set in production
  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET is not set - denying access');
    return false;
  }
  
  // Check Authorization header with Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // For Vercel Cron: verify using CRON_SECRET
  // Vercel sets the Authorization header automatically when CRON_SECRET is configured
  // See: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  // The x-vercel-cron header alone is NOT secure and can be spoofed
  // Vercel will automatically include Authorization: Bearer <CRON_SECRET> when calling cron endpoints
  
  return false;
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Daily prompt generation triggered');
    
    const orchestrator = getPromptOrchestrator();
    const result = await orchestrator.runDailyGenerationForAllUsers();

    return NextResponse.json({
      success: true,
      message: "Daily prompt generation completed",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Daily prompt generation failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}


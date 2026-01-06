/**
 * Prompt Generation Orchestrator
 * Coordinates the entire prompt generation pipeline
 */

import { getResearchAgent } from './agents/research-agent';
import { getPromptComposerAgent } from './agents/prompt-composer';
import { getVisualComposerAgent } from './agents/visual-composer';
import { JOB_CONFIG } from './config';
import * as repository from './repository';
import type {
  PipelineResult,
  PromptGenerationJob,
  ResearchReport,
  PromptContent,
  GeneratedVisual,
  JobProgress,
} from './types';

/**
 * Select random interests from user's preferences
 */
function selectRandomInterests(interests: string[], count: number): string[] {
  if (interests.length <= count) {
    return [...interests];
  }

  const shuffled = [...interests].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Run a single interest pipeline with parallel execution
 * 
 * Pipeline structure:
 * 1. Research (must complete first - composition depends on it)
 * 2. Composition + Visual (run in parallel - visual only needs topic, not hook)
 * 
 * This reduces total time from ~18s to ~14s per interest
 */
async function runInterestPipeline(
  interest: string,
  jobId: string
): Promise<PipelineResult> {
  const researchAgent = getResearchAgent();
  const composerAgent = getPromptComposerAgent();
  const visualAgent = getVisualComposerAgent();

  try {
    // Step 1: Research (must complete first)
    console.log(`[${jobId}] 📚 Researching: ${interest}`);
    const research: ResearchReport = await researchAgent.research(interest);

    // Step 2: Run Composition and Visual generation IN PARALLEL
    // Visual only needs the topic, not the composed content
    console.log(`[${jobId}] ⚡ Running composition + visual in parallel for: ${interest}`);
    
    const [content, visual] = await Promise.all([
      // Composition task
      (async (): Promise<PromptContent> => {
        console.log(`[${jobId}] ✍️  Composing prompt for: ${interest}`);
        return composerAgent.compose(research);
      })(),
      
      // Visual generation task (runs in parallel)
      (async (): Promise<GeneratedVisual | null> => {
        console.log(`[${jobId}] 🎨 Generating visual for: ${interest}`);
        try {
          return await visualAgent.generate(interest, research.summary);
        } catch (visualError) {
          console.warn(`[${jobId}] Visual generation failed, continuing without image:`, visualError);
          return null;
        }
      })(),
    ]);

    console.log(`[${jobId}] ✅ Pipeline complete for: ${interest}`);

    return {
      interest,
      research,
      content,
      visual,
      success: true,
    };
  } catch (error) {
    console.error(`[${jobId}] Pipeline failed for ${interest}:`, error);
    return {
      interest,
      research: createEmptyResearch(interest),
      content: createFallbackContent(interest),
      visual: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create empty research report for failures
 */
function createEmptyResearch(interest: string): ResearchReport {
  return {
    interest,
    trends: [],
    interestingAngles: [],
    sources: [],
    summary: '',
    currentEvents: [],
    debatesAndDiscussions: [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Create fallback content for failures
 */
function createFallbackContent(interest: string): PromptContent {
  return {
    hook: `What ${interest.toLowerCase()} means to you`,
    blurb: `<p>Sometimes the best writing comes from simply reflecting on what matters to us. ${interest} touches our lives in ways both obvious and subtle.</p><p>What would you write if you let yourself explore this topic freely?</p>`,
    tags: [interest.toLowerCase().replace(/\s+/g, '-')],
    suggestedAngles: [
      `Your personal experience with ${interest.toLowerCase()}`,
      `How ${interest.toLowerCase()} has changed over time`,
    ],
  };
}

/**
 * Main orchestrator class
 */
export class PromptOrchestrator {
  /**
   * Start prompt generation for a user
   * Called immediately after onboarding completion
   */
  async generatePrompts(clerkUserId: string): Promise<PromptGenerationJob> {
    // Get internal user ID
    const userId = await repository.getInternalUserId(clerkUserId);
    if (!userId) {
      throw new Error('User not found');
    }

    // Check for existing active job
    const existingJob = await repository.getActiveJobForUser(userId);
    if (existingJob) {
      console.log(`Active job exists for user ${userId}: ${existingJob.id}`);
      return existingJob;
    }

    // Get user preferences
    const preferences = await repository.getUserPreferences(clerkUserId);
    if (!preferences || preferences.interests.length === 0) {
      throw new Error('No interests found for user');
    }

    // Select random interests
    const selectedInterests = selectRandomInterests(
      preferences.interests,
      JOB_CONFIG.interestsPerGeneration
    );

    // Create job record
    const job = await repository.createPromptGenerationJob({
      userId,
      selectedInterests,
    });

    // Start background processing (don't await - fire and forget)
    this.processJob(job.id, userId, selectedInterests).catch(error => {
      console.error(`Job ${job.id} failed:`, error);
    });

    return job;
  }

  /**
   * Process the generation job in the background
   */
  private async processJob(
    jobId: string,
    userId: string,
    interests: string[]
  ): Promise<void> {
    console.log(`[${jobId}] Starting prompt generation for ${interests.length} interests`);

    try {
      // Update job status to processing
      await repository.updateJobStatus(jobId, 'processing');

      // Run all pipelines in parallel
      const results = await Promise.all(
        interests.map(interest => runInterestPipeline(interest, jobId))
      );

      // Count successes
      const successfulResults = results.filter(r => r.success);
      console.log(`[${jobId}] Completed: ${successfulResults.length}/${results.length} successful`);

      // Save successful prompts to database
      for (const result of successfulResults) {
        await repository.createWritingPrompt({
          userId,
          interest: result.interest,
          hook: result.content.hook,
          blurb: result.content.blurb,
          imageUrl: result.visual?.imageUrl || null,
          tags: result.content.tags,
          suggestedAngles: result.content.suggestedAngles,
          sources: result.research.sources,
          artStyle: result.visual?.artStyle || null,
          status: 'ready',
        });
      }

      // Update job progress - only count successful results
      await repository.updateJobProgress(jobId, {
        researchCompleted: successfulResults.length,
        compositionCompleted: successfulResults.length,
        visualsCompleted: successfulResults.filter(r => r.visual).length,
      });

      // Mark job as completed
      if (successfulResults.length > 0) {
        await repository.updateJobStatus(jobId, 'completed');
        console.log(`[${jobId}] Job completed successfully`);
      } else {
        await repository.updateJobStatus(jobId, 'failed', 'All pipelines failed');
        console.log(`[${jobId}] Job failed - no successful pipelines`);
      }
    } catch (error) {
      console.error(`[${jobId}] Job processing error:`, error);
      await repository.updateJobStatus(
        jobId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get job status with progress information
   * 
   * Progress is calculated as follows:
   * - Each interest goes through 3 stages: research, composition, visuals
   * - But in our parallel pipeline, all stages complete together per interest
   * - So we calculate progress based on completed interests, not individual stages
   * - Total = number of interests to process
   * - Completed = number of interests that finished (research + composition done)
   * - Visuals are optional (graceful degradation), so they don't block completion
   */
  async getJobStatus(jobId: string): Promise<{
    job: PromptGenerationJob;
    progress: JobProgress;
  } | null> {
    const job = await repository.getJobById(jobId);
    if (!job) return null;

    const totalInterests = job.selectedInterests.length;
    
    // Progress is based on how many interests completed their core pipeline
    // (research + composition). Visuals are bonus and don't affect progress.
    const completedInterests = Math.min(job.researchCompleted, job.compositionCompleted);
    
    // Calculate percentage-based progress (0-100 scale for easier UI use)
    const total = totalInterests;
    const completed = completedInterests;

    // Determine current stage based on what's been completed
    let stage: JobProgress['stage'] = 'research';
    if (job.status === 'completed' || job.status === 'failed') {
      stage = 'done';
    } else if (completedInterests >= totalInterests) {
      // All interests done with core pipeline, may still be generating visuals
      stage = 'visuals';
    } else if (job.researchCompleted > 0) {
      // Some research done, moving to composition
      stage = 'composition';
    }

    return {
      job,
      progress: {
        total,
        completed,
        stage,
      },
    };
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<void> {
    await repository.updateJobStatus(jobId, 'cancelled');
  }

  /**
   * Regenerate prompts for a user (manual refresh)
   */
  async regeneratePrompts(clerkUserId: string): Promise<PromptGenerationJob> {
    // This will create a new job, ignoring any ready prompts
    // The frontend can choose to keep or dismiss old prompts
    return this.generatePrompts(clerkUserId);
  }

  /**
   * Generate daily prompts for a user if they haven't received any today
   * Returns null if prompts were already generated today
   */
  async generateDailyPrompts(clerkUserId: string): Promise<PromptGenerationJob | null> {
    // Get internal user ID
    const userId = await repository.getInternalUserId(clerkUserId);
    if (!userId) {
      console.log(`[Daily] User not found: ${clerkUserId}`);
      return null;
    }

    // Check if already generated today
    const hasGenerated = await repository.hasGeneratedToday(userId);
    if (hasGenerated) {
      console.log(`[Daily] Already generated today for user: ${userId}`);
      return null;
    }

    console.log(`[Daily] Generating new prompts for user: ${userId}`);
    return this.generatePrompts(clerkUserId);
  }

  /**
   * Run daily generation for all users
   * Called by cron job
   */
  async runDailyGenerationForAllUsers(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    console.log('[Daily Cron] Starting daily prompt generation for all users');

    const clerkUserIds = await repository.getUsersNeedingDailyPrompts();
    console.log(`[Daily Cron] Found ${clerkUserIds.length} users needing prompts`);

    let succeeded = 0;
    let failed = 0;

    // Process users in batches to avoid overwhelming the system
    const BATCH_SIZE = 5;
    for (let i = 0; i < clerkUserIds.length; i += BATCH_SIZE) {
      const batch = clerkUserIds.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(clerkUserId => this.generateDailyPrompts(clerkUserId))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          succeeded++;
        } else if (result.status === 'rejected') {
          failed++;
          console.error('[Daily Cron] Failed for user:', result.reason);
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < clerkUserIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[Daily Cron] Completed: ${succeeded} succeeded, ${failed} failed`);

    return {
      processed: clerkUserIds.length,
      succeeded,
      failed,
    };
  }
}

// Export singleton factory
let orchestratorInstance: PromptOrchestrator | null = null;

export function getPromptOrchestrator(): PromptOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new PromptOrchestrator();
  }
  return orchestratorInstance;
}


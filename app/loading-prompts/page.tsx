"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface JobStatus {
  job: {
    id: string;
    status: string;
  };
  progress: {
    total: number;
    completed: number;
    stage: string;
  };
}

export default function LoadingPrompts() {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPrompts, setHasPrompts] = useState(false);

  // Trigger prompt generation on mount
  useEffect(() => {
    async function triggerGeneration() {
      try {
        const response = await fetch("/api/prompts", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          setJobId(data.jobId);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || "Failed to start prompt generation");
        }
      } catch (err) {
        console.error("Failed to trigger prompt generation:", err);
        setError("Failed to start prompt generation");
      }
    }

    triggerGeneration();
  }, []);

  // Poll for job status and prompts
  useEffect(() => {
    // Start polling even if we don't have a jobId yet (might be generating)
    // or if we have an error (to check if prompts appeared anyway)

    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 300; // Poll for max 10 minutes (300 * 2s)

    async function checkStatus() {
      try {
        // First, check if prompts are ready
        const promptsResponse = await fetch("/api/prompts?status=ready,used&limit=1");
        if (promptsResponse.ok) {
          const promptsData = await promptsResponse.json();
          if (promptsData.prompts && promptsData.prompts.length > 0) {
            setHasPrompts(true);
            clearInterval(pollInterval);
            // Wait a moment then redirect
            setTimeout(() => {
              router.push("/dashboard");
            }, 1000);
            return;
          }
        }

        // If we have a job ID, check job status
        if (jobId) {
          try {
            const jobResponse = await fetch(`/api/prompts/job/${jobId}`);
            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              setJobStatus(jobData);

              // If job is completed or failed, check prompts one more time
              if (jobData.job.status === "completed" || jobData.job.status === "failed") {
                const finalPromptsResponse = await fetch("/api/prompts?status=ready,used&limit=1");
                if (finalPromptsResponse.ok) {
                  const finalPromptsData = await finalPromptsResponse.json();
                  if (finalPromptsData.prompts && finalPromptsData.prompts.length > 0) {
                    setHasPrompts(true);
                    clearInterval(pollInterval);
                    setTimeout(() => {
                      router.push("/dashboard");
                    }, 1000);
                    return;
                  }
                }

                // If job failed and no prompts, show error but still redirect
                if (jobData.job.status === "failed") {
                  setError("Prompt generation failed. Redirecting to dashboard...");
                  clearInterval(pollInterval);
                  setTimeout(() => {
                    router.push("/dashboard");
                  }, 3000);
                  return;
                }
              }
            }
          } catch (jobErr) {
            // Job endpoint might fail, but continue polling for prompts
            console.warn("Failed to fetch job status:", jobErr);
          }
        }

        pollCount++;
        if (pollCount >= MAX_POLLS) {
          clearInterval(pollInterval);
          // Even if generation isn't complete, redirect to dashboard
          // The dashboard will show loading state for prompts
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check status:", err);
        // Don't set error here, just continue polling
      }
    }

    // Start polling immediately, then every 2 seconds
    checkStatus();
    pollInterval = setInterval(checkStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, error, router]);

  const getStageMessage = () => {
    if (hasPrompts) return "Prompts ready!";
    if (error) return error;
    if (!jobStatus) return "Starting prompt generation...";
    
    const stage = jobStatus.progress.stage;
    const completed = jobStatus.progress.completed;
    const total = jobStatus.progress.total;

    switch (stage) {
      case "research":
        return `Researching topics... (${completed}/${total})`;
      case "composition":
        return `Composing writing prompts... (${completed}/${total})`;
      case "visuals":
        return `Creating images... (${completed}/${total})`;
      default:
        return "Generating your personalized prompts...";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <div className="text-center max-w-md px-8">
        {/* Ink Logo */}
        <h1 className="text-7xl font-bold text-[#171717] mb-8 md:text-8xl">
          ink
        </h1>

        {/* Loading indicator */}
        <div className="mb-6">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-[#171717]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Status message */}
        <p className="text-lg text-[#171717]/70 mb-2">
          {getStageMessage()}
        </p>

        {/* Progress bar if we have job status */}
        {jobStatus && !hasPrompts && !error && (
          <div className="mt-6">
            <div className="w-full bg-[#E8E0D5] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#171717] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(jobStatus.progress.completed / jobStatus.progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Helpful message */}
        {!error && !hasPrompts && (
          <p className="text-sm text-[#171717]/40 italic mt-6">
            This may take a minute or two. We're crafting personalized writing prompts just for you.
          </p>
        )}
      </div>
    </div>
  );
}

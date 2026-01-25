"use client";
/* home page of app */
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import WritingEntry from "../components/WritingEntry";
import PromptCard from "../components/PromptCard";
import PromptViewer from "../components/PromptViewer";
import { useOnboardingCheck } from "../hooks/useOnboardingCheck";

interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WritingPrompt {
  id: string;
  hook: string;
  blurb: string;
  imageUrl: string | null;
  interest: string;
  tags: string[];
  status: string;
}

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

export default function Dashboard() {
  const router = useRouter();
  const { isChecking, isOnboarded } = useOnboardingCheck();
  const [writings, setWritings] = useState<JournalEntry[]>([]);
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [generationJob, setGenerationJob] = useState<JobStatus | null>(null);

  // Fetch journal entries
  useEffect(() => {
    async function fetchEntries() {
      try {
        const response = await fetch("/api/entries");
        if (response.ok) {
          const data = await response.json();
          setWritings(data.entries || []);
        }
      } catch (error) {
        console.error("Failed to fetch entries:", error);
      } finally {
        setIsLoadingEntries(false);
      }
    }

    fetchEntries();
  }, []);

  // Fetch writing prompts (include both ready and used so they stay visible after clicking)
  const fetchPrompts = useCallback(async () => {
    try {
      const response = await fetch("/api/prompts?status=ready,used&limit=3");
      if (response.ok) {
        const data = await response.json();
        if (data.prompts && Array.isArray(data.prompts)) {
          // Validate that prompts have required fields
          const validPrompts = data.prompts.filter((p: WritingPrompt) => 
            p && p.id && p.hook && p.interest !== undefined
          );
          setPrompts(validPrompts);
        } else {
          setPrompts([]);
        }
      } else {
        setPrompts([]);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      setPrompts([]);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Poll for generation job status if prompts are loading
  useEffect(() => {
    if (prompts.length > 0 || !isLoadingPrompts) return;

    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 60; // Poll for max 2 minutes

    async function checkJobStatus() {
      try {
        // Try to get prompts first (include both ready and used)
        const promptsResponse = await fetch("/api/prompts?status=ready,used&limit=3");
        if (promptsResponse.ok) {
          const data = await promptsResponse.json();
          console.log("Polling - Prompts API response:", data);
          if (data.prompts && Array.isArray(data.prompts) && data.prompts.length > 0) {
            setPrompts(data.prompts);
            setGenerationJob(null);
            clearInterval(pollInterval);
            return;
          }
        } else {
          console.error("Polling - Failed to fetch prompts:", promptsResponse.status);
        }

        pollCount++;
        if (pollCount >= MAX_POLLS) {
          clearInterval(pollInterval);
          setGenerationJob(null);
        }
      } catch (error) {
        console.error("Failed to check job status:", error);
      }
    }

    // Start polling
    pollInterval = setInterval(checkJobStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [prompts.length, isLoadingPrompts]);

  // Handle prompt selection
  const handlePromptSelect = useCallback((promptId: string) => {
    setSelectedPromptId(promptId);
  }, []);

  // Handle prompt viewer close
  const handlePromptViewerClose = useCallback(() => {
    setSelectedPromptId(null);
  }, []);

  // Determine if we should show loading state for prompts
  const isGenerating = generationJob && generationJob.job.status === 'processing';
  const showPromptLoading = isLoadingPrompts || isGenerating;

  // Show loading while checking onboarding status
  if (isChecking || !isOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
        <div className="animate-pulse text-[#171717]/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FFFAF0]">
      <Sidebar />

      {/* Main Content Area - Centered Column */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Ink Logo */}
          <h1 className="text-7xl font-bold text-[#171717] mb-10 md:text-8xl">
            ink
          </h1>

          {/* Writing Prompts Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#171717]/60 uppercase tracking-wide">
                {isGenerating ? "Generating your prompts..." : "Today's prompts"}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {showPromptLoading ? (
                // Loading skeletons
                <>
                  <PromptCard
                    id="loading-1"
                    hook=""
                    imageUrl={null}
                    interest=""
                    onSelect={() => {}}
                    isLoading
                  />
                  <PromptCard
                    id="loading-2"
                    hook=""
                    imageUrl={null}
                    interest=""
                    onSelect={() => {}}
                    isLoading
                  />
                  <PromptCard
                    id="loading-3"
                    hook=""
                    imageUrl={null}
                    interest=""
                    onSelect={() => {}}
                    isLoading
                  />
                </>
              ) : prompts.length > 0 ? (
                // Actual prompts
                prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    hook={prompt.hook}
                    imageUrl={prompt.imageUrl}
                    interest={prompt.interest}
                    onSelect={handlePromptSelect}
                  />
                ))
              ) : (
                // Empty state
                <div className="col-span-3 py-8 text-center">
                  <p className="text-sm text-[#171717]/40 italic mb-4">
                    No prompts yet. Complete onboarding to get personalized writing ideas.
                  </p>
                </div>
              )}
            </div>

            {/* Generation progress indicator */}
            {isGenerating && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#171717]/40">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>
                  {generationJob.progress.stage === 'research' && "Researching topics..."}
                  {generationJob.progress.stage === 'composition' && "Composing hooks..."}
                  {generationJob.progress.stage === 'visuals' && "Creating visuals..."}
                </span>
              </div>
            )}
          </section>

          {/* Writings Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#171717] mb-4 md:text-2xl">
              Writings
            </h2>
            <div className="space-y-2">
              {isLoadingEntries ? (
                <p className="text-sm text-[#171717]/40 italic">Loading...</p>
              ) : writings.length === 0 ? (
                <p className="text-sm text-[#171717]/40 italic">
                  Your first entry will appear here...
                </p>
              ) : (
                writings.map((writing) => (
                  <WritingEntry
                    key={writing.id}
                    title={writing.title}
                    date={formatDate(writing.createdAt)}
                    onClick={() => router.push(`/p/${writing.slug}`)}
                  />
                ))
              )}
            </div>
          </section>

          {/* New Entry Button - Fixed bottom right */}
          <div className="fixed bottom-8 right-8">
            <button
              onClick={() => router.push("/write")}
              className="rounded-full bg-[#FEBC2F] px-6 py-3 text-sm font-semibold text-[#171717] transition-opacity hover:opacity-90 shadow-lg md:px-8 md:py-3.5 md:text-base"
            >
              New entry
            </button>
          </div>
        </div>
      </main>

      {/* Prompt Viewer overlay */}
      {selectedPromptId && (
        <PromptViewer
          promptId={selectedPromptId}
          onClose={handlePromptViewerClose}
        />
      )}
    </div>
  );
}

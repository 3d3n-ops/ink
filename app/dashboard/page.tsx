"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import WritingEntry from "../components/WritingEntry";
import PromptCard from "../components/PromptCard";
import PromptSlideshow from "../components/PromptSlideshow";

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
  const [writings, setWritings] = useState<JournalEntry[]>([]);
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [generationJob, setGenerationJob] = useState<JobStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Fetch writing prompts
  const fetchPrompts = useCallback(async () => {
    try {
      const response = await fetch("/api/prompts?status=ready&limit=3");
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
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
        // Try to get prompts first
        const promptsResponse = await fetch("/api/prompts?status=ready&limit=3");
        if (promptsResponse.ok) {
          const data = await promptsResponse.json();
          if (data.prompts && data.prompts.length > 0) {
            setPrompts(data.prompts);
            setGenerationJob(null);
            clearInterval(pollInterval);
            return;
          }
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
  const handlePromptSelect = useCallback(async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      setSelectedPrompt(prompt);
    }
  }, [prompts]);

  // Handle slideshow completion
  const handleSlideshowComplete = useCallback(() => {
    setSelectedPrompt(null);
    fetchPrompts(); // Refresh prompts after using one
  }, [fetchPrompts]);

  // Handle slideshow cancel
  const handleSlideshowCancel = useCallback(() => {
    setSelectedPrompt(null);
  }, []);

  // Handle refresh prompts
  const handleRefreshPrompts = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/prompts/refresh", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setGenerationJob({
          job: { id: data.jobId, status: 'processing' },
          progress: { total: 9, completed: 0, stage: 'research' }
        });
        // Start polling for new prompts
        setPrompts([]);
        setIsLoadingPrompts(true);
      }
    } catch (error) {
      console.error("Failed to refresh prompts:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Determine if we should show loading state for prompts
  const isGenerating = generationJob && generationJob.job.status === 'processing';
  const showPromptLoading = isLoadingPrompts || isGenerating;

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
              {prompts.length > 0 && (
                <button
                  onClick={handleRefreshPrompts}
                  disabled={isRefreshing}
                  className="text-sm text-[#171717]/40 hover:text-[#171717] transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Refreshing...
                    </span>
                  ) : (
                    "Refresh"
                  )}
                </button>
              )}
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

      {/* Slideshow overlay */}
      {selectedPrompt && (
        <PromptSlideshow
          promptId={selectedPrompt.id}
          hook={selectedPrompt.hook}
          blurb={selectedPrompt.blurb}
          imageUrl={selectedPrompt.imageUrl}
          interest={selectedPrompt.interest}
          onComplete={handleSlideshowComplete}
          onCancel={handleSlideshowCancel}
        />
      )}
    </div>
  );
}

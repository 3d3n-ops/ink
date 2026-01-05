"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import RichTextEditor from "../components/RichTextEditor";
import Sidebar from "../components/Sidebar";
import { FaMedium, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { SiSubstack } from "react-icons/si";
import { useOnboardingCheck } from "../hooks/useOnboardingCheck";

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 60); // Limit length
}

// Ink logo icon component
const InkIcon = () => (
  <span 
    className="text-base font-bold"
    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
  >
    ink
  </span>
);

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isChecking, isOnboarded } = useOnboardingCheck();
  const editSlug = searchParams.get("edit");
  const promptTitle = searchParams.get("title");
  const promptId = searchParams.get("prompt");
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const isEditMode = Boolean(editSlug);

  // Show loading while checking onboarding status
  if (isChecking || !isOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
        <div className="animate-pulse text-[#171717]/40">Loading...</div>
      </div>
    );
  }

  // Pre-fill title from prompt if provided
  useEffect(() => {
    if (promptTitle && !isEditMode && !title) {
      setTitle(decodeURIComponent(promptTitle));
    }
  }, [promptTitle, isEditMode, title]);

  // Fetch entry data when in edit mode
  useEffect(() => {
    async function fetchEntry() {
      if (!editSlug) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/entries/${editSlug}`);
        if (response.ok) {
          const data = await response.json();
          setTitle(data.entry.title);
          setSlug(data.entry.slug);
          setOriginalSlug(data.entry.slug);
          setContent(data.entry.content);
          setIsSlugManuallyEdited(true);
          // Force re-render of the editor with new content
          setEditorKey(prev => prev + 1);
        } else {
          setError("Failed to load entry");
        }
      } catch (err) {
        console.error("Failed to fetch entry:", err);
        setError("Failed to load entry");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntry();
  }, [editSlug]);

  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-generate slug from title unless manually edited (only for new entries)
  useEffect(() => {
    if (!isSlugManuallyEdited && title && !isEditMode) {
      setSlug(generateSlug(title));
    }
  }, [title, isSlugManuallyEdited, isEditMode]);

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(generateSlug(value));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please add a title");
      return;
    }
    if (!content.trim()) {
      setError("Please add some content");
      return;
    }
    
    setError("");
    setIsSaving(true);
    
    try {
      const url = isEditMode 
        ? `/api/entries/${originalSlug}` 
        : "/api/entries";
      
      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug || generateSlug(title),
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await response.json();
      router.push(`/p/${data.entry.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "ink.app";

  return (
    <div className="flex min-h-screen bg-[#FFFAF0]">
      <Sidebar />

      {/* Main Content Area - Centered like Substack */}
      <main className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-[#FFFAF0] border-b border-[#171717]/5">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#171717]/60 hover:text-[#171717] transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <div className="flex items-center gap-3">
              {/* Word Counter */}
              <span className="text-xs text-[#171717]/40">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>

              {error && (
                <span className="text-sm text-red-500">{error}</span>
              )}

              {/* Share Button with Dropdown */}
              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-1.5 rounded-[20px] border border-[#171717]/20 px-4 py-2 text-sm font-medium text-[#171717] transition-colors hover:bg-[#171717]/5"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </button>

                {/* Share Dropdown Menu */}
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#171717]/10 py-2 z-30">
                    <p className="px-4 py-2 text-xs text-[#171717]/50 font-medium uppercase tracking-wide">
                      Publish to
                    </p>
                    
                    <button
                      onClick={() => {
                        // TODO: Implement Ink publishing
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#171717] hover:bg-[#FEBC2F]/10 transition-colors"
                    >
                      <span className="w-5 h-5 flex items-center justify-center text-[#171717]">
                        <InkIcon />
                      </span>
                      Ink
                    </button>

                    <button
                      onClick={() => {
                        // TODO: Implement Substack integration
                        window.open("https://substack.com", "_blank");
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#171717] hover:bg-[#FF6719]/10 transition-colors"
                    >
                      <SiSubstack className="w-5 h-5 text-[#FF6719]" />
                      Substack
                    </button>

                    <button
                      onClick={() => {
                        // TODO: Implement Medium integration
                        window.open("https://medium.com", "_blank");
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#171717] hover:bg-[#000]/5 transition-colors"
                    >
                      <FaMedium className="w-5 h-5 text-[#000]" />
                      Medium
                    </button>

                    <button
                      onClick={() => {
                        // TODO: Implement X/Twitter integration
                        window.open("https://x.com", "_blank");
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#171717] hover:bg-[#000]/5 transition-colors"
                    >
                      <FaXTwitter className="w-5 h-5 text-[#000]" />
                      X (Twitter)
                    </button>

                    <button
                      onClick={() => {
                        // TODO: Implement Instagram integration
                        window.open("https://instagram.com", "_blank");
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#171717] hover:bg-[#E4405F]/10 transition-colors"
                    >
                      <FaInstagram className="w-5 h-5 text-[#E4405F]" />
                      Instagram
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="rounded-[20px] bg-[#FEBC2F] px-5 py-2 text-sm font-bold text-[#171717] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : isEditMode ? "Update entry" : "Save entry"}
              </button>
            </div>
          </div>
        </div>

        {/* Centered Editor Container */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-3xl px-6 py-12">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-4xl md:text-5xl font-bold text-[#171717] bg-transparent border-none outline-none mb-4 placeholder:text-[#171717]/25"
            />

            {/* URL/Slug Display */}
            <div className="flex items-center gap-2 mb-8 pb-8 border-b border-[#171717]/10">
              <span className="text-sm text-[#171717]/40">
                {baseUrl}/p/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-post-slug"
                className="flex-1 text-sm text-[#171717]/70 bg-transparent border-none outline-none placeholder:text-[#171717]/30"
              />
              {slug && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/p/${slug}`);
                  }}
                  className="text-xs text-[#171717]/40 hover:text-[#171717] transition-colors"
                  title="Copy URL"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              )}
            </div>

            {/* Editor */}
            {isLoading ? (
              <p className="text-[#171717]/40 italic">Loading entry...</p>
            ) : (
              <RichTextEditor
                key={editorKey}
                content={content}
                onUpdate={setContent}
                onWordCountChange={setWordCount}
                placeholder="Tell your story..."
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#FFFAF0] items-center justify-center">
        <p className="text-[#171717]/40 italic">Loading...</p>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}


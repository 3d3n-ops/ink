"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PromptViewerProps {
  promptId: string;
  onClose: () => void;
}

interface PromptData {
  id: string;
  hook: string;
  blurb: string;
  imageUrl: string | null;
  interest: string;
  tags: string[];
  suggestedAngles: string[];
}

export default function PromptViewer({ promptId, onClose }: PromptViewerProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const response = await fetch(`/api/prompts/${promptId}`);
        if (response.ok) {
          const data = await response.json();
          setPrompt(data.prompt);
        }
      } catch (error) {
        console.error('Failed to fetch prompt:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompt();
  }, [promptId]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleWrite = () => {
    if (prompt) {
      router.push(`/write?prompt=${promptId}&title=${encodeURIComponent(prompt.hook)}`);
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFAF0]/95 backdrop-blur-sm">
        <div className="animate-pulse text-[#171717]/40">Loading prompt...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFAF0]/95 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-[#171717]/60 mb-4">Failed to load prompt</p>
          <button
            onClick={onClose}
            className="text-sm text-[#171717]/60 hover:text-[#171717] underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFAF0]/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 text-[#171717]/40 hover:text-[#171717] transition-colors z-10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Content container - side by side layout */}
      <div 
        className="max-w-5xl w-full max-h-[90vh] bg-[#FFFAF0] rounded-lg shadow-xl border border-[#171717]/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left side - Image */}
          <div className="w-full md:w-2/5 relative bg-[#E8E0D5] flex-shrink-0">
            {prompt.imageUrl ? (
              <Image
                src={prompt.imageUrl}
                alt={prompt.hook}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#171717]/20">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Right side - Content */}
          <div className="w-full md:w-3/5 flex flex-col overflow-y-auto p-6 md:p-8">
            {/* Interest tag */}
            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium text-[#171717]/60 bg-[#171717]/5 rounded-full self-start">
              {prompt.interest}
            </div>

            {/* Hook/Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#171717] mb-4 md:mb-6 leading-tight">
              {prompt.hook}
            </h1>

            {/* Blurb */}
            <div 
              className="prose prose-base md:prose-lg text-[#171717]/70 max-w-none mb-6 flex-1"
              dangerouslySetInnerHTML={{ __html: prompt.blurb }}
            />

            {/* Suggested Angles */}
            {prompt.suggestedAngles && prompt.suggestedAngles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs md:text-sm font-semibold text-[#171717]/60 uppercase tracking-wide mb-2 md:mb-3">
                  Suggested Angles
                </h3>
                <ul className="space-y-1.5 md:space-y-2">
                  {prompt.suggestedAngles.map((angle, index) => (
                    <li key={index} className="text-xs md:text-sm text-[#171717]/70 flex items-start gap-2">
                      <span className="text-[#FEBC2F] mt-1">•</span>
                      <span>{angle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {prompt.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs text-[#171717]/60 bg-[#171717]/5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Write button - bottom corner */}
        <div className="relative p-4 md:p-6 border-t border-[#171717]/10">
          <div className="flex justify-end">
            <button
              onClick={handleWrite}
              className="rounded-full bg-[#FEBC2F] px-6 py-3 text-sm font-semibold text-[#171717] transition-opacity hover:opacity-90 shadow-lg md:px-8 md:py-3.5 md:text-base"
            >
              Write
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


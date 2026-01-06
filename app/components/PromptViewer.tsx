"use client";

import { useState, useEffect } from "react";
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

      {/* Content container */}
      <div 
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#FFFAF0] rounded-lg shadow-xl border border-[#171717]/10 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {prompt.imageUrl && (
          <div className="relative w-full aspect-video mb-8 overflow-hidden rounded-lg">
            <Image
              src={prompt.imageUrl}
              alt={prompt.hook}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Interest tag */}
        <div className="inline-block px-3 py-1 mb-4 text-xs font-medium text-[#171717]/60 bg-[#171717]/5 rounded-full">
          {prompt.interest}
        </div>

        {/* Hook/Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#171717] mb-6 leading-tight">
          {prompt.hook}
        </h1>

        {/* Blurb */}
        <div 
          className="prose prose-lg text-[#171717]/70 max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: prompt.blurb }}
        />

        {/* Suggested Angles */}
        {prompt.suggestedAngles && prompt.suggestedAngles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#171717]/60 uppercase tracking-wide mb-3">
              Suggested Angles
            </h3>
            <ul className="space-y-2">
              {prompt.suggestedAngles.map((angle, index) => (
                <li key={index} className="text-sm text-[#171717]/70 flex items-start gap-2">
                  <span className="text-[#FEBC2F] mt-1">•</span>
                  <span>{angle}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
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

        {/* Close hint */}
        <p className="mt-8 text-center text-sm text-[#171717]/40">
          Press <kbd className="px-2 py-0.5 bg-[#171717]/5 rounded text-xs">Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
}


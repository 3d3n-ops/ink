"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PromptSlideshowProps {
  promptId: string;
  hook: string;
  blurb: string;
  imageUrl: string | null;
  interest: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function PromptSlideshow({
  promptId,
  hook,
  blurb,
  imageUrl,
  interest,
  onComplete,
  onCancel,
}: PromptSlideshowProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'entering' | 'showing' | 'exiting'>('entering');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Random duration between 5-8 seconds
    const showDuration = 5000 + Math.random() * 3000; // 5000-8000ms
    const progressSteps = Math.ceil(showDuration / 50); // Update progress every 50ms
    
    // Phase 1: Enter animation (0.5s)
    const enterTimeout = setTimeout(() => {
      setPhase('showing');
    }, 500);

    // Progress animation during showing phase
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / progressSteps);
      });
    }, 50);

    // Phase 2: Show for random duration (5-8 seconds), then exit
    const showTimeout = setTimeout(() => {
      setPhase('exiting');
    }, 500 + showDuration);

    // Phase 3: Exit animation then navigate
    const exitTimeout = setTimeout(async () => {
      // Mark prompt as used
      try {
        await fetch(`/api/prompts/${promptId}/use`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to mark prompt as used:', error);
      }
      
      // Navigate to editor with prompt data
      router.push(`/write?prompt=${promptId}&title=${encodeURIComponent(hook)}`);
      onComplete();
    }, 500 + showDuration + 500); // Enter + show + exit

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(showTimeout);
      clearTimeout(exitTimeout);
      clearInterval(progressInterval);
    };
  }, [promptId, hook, router, onComplete]);

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#FFFAF0] transition-opacity duration-500 ${
        phase === 'entering' ? 'opacity-0' : phase === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onCancel}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        className="absolute top-6 right-6 text-[#171717]/40 hover:text-[#171717] transition-colors z-10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Content container */}
      <div 
        className={`max-w-3xl w-full mx-8 transition-all duration-700 ${
          phase === 'entering' ? 'translate-y-8 opacity-0' : 
          phase === 'exiting' ? '-translate-y-8 opacity-0' : 
          'translate-y-0 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {imageUrl && (
          <div className="relative w-full aspect-video mb-8 overflow-hidden">
            <Image
              src={imageUrl}
              alt={hook}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Interest tag */}
        <div 
          className={`inline-block px-3 py-1 mb-4 text-xs font-medium text-[#171717]/60 bg-[#171717]/5 rounded-full transition-all duration-500 delay-100 ${
            phase === 'showing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {interest}
        </div>

        {/* Hook/Title */}
        <h1 
          className={`text-3xl md:text-4xl lg:text-5xl font-bold text-[#171717] mb-6 leading-tight transition-all duration-500 delay-150 ${
            phase === 'showing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {hook}
        </h1>

        {/* Blurb preview */}
        <div 
          className={`prose prose-lg text-[#171717]/70 max-w-none transition-all duration-500 delay-200 ${
            phase === 'showing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          dangerouslySetInnerHTML={{ __html: blurb }}
        />

        {/* Progress bar */}
        <div className="mt-8 h-1 w-full bg-[#171717]/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FEBC2F] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip hint */}
        <p 
          className={`mt-4 text-center text-sm text-[#171717]/40 transition-all duration-500 delay-300 ${
            phase === 'showing' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Press <kbd className="px-2 py-0.5 bg-[#171717]/5 rounded text-xs">Esc</kbd> or click anywhere to skip
        </p>
      </div>
    </div>
  );
}


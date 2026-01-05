"use client";

import { useState } from "react";
import Image from "next/image";

interface PromptCardProps {
  id: string;
  hook: string;
  imageUrl: string | null;
  interest: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function PromptCard({
  id,
  hook,
  imageUrl,
  interest,
  onSelect,
  isLoading = false,
}: PromptCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex flex-col cursor-pointer group"
      onClick={() => !isLoading && onSelect(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with aspect ratio */}
      <div className="relative w-full aspect-[4/3] mb-2 overflow-hidden bg-[#E8E0D5]">
        {isLoading ? (
          // Loading skeleton with shimmer
          <div className="absolute inset-0 animate-shimmer" />
        ) : imageUrl && !imageError ? (
          // Actual image
          <Image
            src={imageUrl}
            alt={hook}
            fill
            className={`object-cover transition-transform duration-500 ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          // Placeholder with gradient based on interest
          <div 
            className={`absolute inset-0 transition-all duration-300 ${
              isHovered ? 'opacity-90' : 'opacity-100'
            }`}
            style={{
              background: getGradientForInterest(interest),
            }}
          />
        )}
        
        {/* Hover overlay */}
        <div 
          className={`absolute inset-0 bg-[#171717] transition-opacity duration-300 ${
            isHovered && !isLoading ? 'opacity-10' : 'opacity-0'
          }`} 
        />
      </div>

      {/* Title/Hook */}
      {isLoading ? (
        <div className="h-5 w-3/4 bg-[#E8E0D5] animate-pulse rounded" />
      ) : (
        <h3 
          className={`text-sm italic text-[#171717] md:text-base line-clamp-2 transition-opacity duration-200 ${
            isHovered ? 'opacity-70' : 'opacity-100'
          }`}
        >
          {hook}
        </h3>
      )}
    </div>
  );
}

// Generate a gradient based on the interest topic
function getGradientForInterest(interest: string): string {
  const gradients: Record<string, string> = {
    'technology': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'ai': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'philosophy': 'linear-gradient(135deg, #2d132c 0%, #4a1942 50%, #801336 100%)',
    'creativity': 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
    'spirituality': 'linear-gradient(135deg, #f8b500 0%, #fceabb 50%, #fff8e1 100%)',
    'faith': 'linear-gradient(135deg, #f8b500 0%, #fceabb 50%, #fff8e1 100%)',
    'relationships': 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #ff9a9e 100%)',
    'love': 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #ff9a9e 100%)',
    'business': 'linear-gradient(135deg, #232526 0%, #414345 50%, #5d5d5d 100%)',
    'money': 'linear-gradient(135deg, #232526 0%, #414345 50%, #5d5d5d 100%)',
    'health': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'fitness': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'culture': 'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
    'society': 'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
    'music': 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    'art': 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    'travel': 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
    'journal': 'linear-gradient(135deg, #DAD299 0%, #B0DAB9 100%)',
    'mental': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'poetry': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  };

  // Find a matching gradient
  const lowerInterest = interest.toLowerCase();
  for (const [key, gradient] of Object.entries(gradients)) {
    if (lowerInterest.includes(key)) {
      return gradient;
    }
  }

  // Default gradient
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}


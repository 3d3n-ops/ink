"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const interests = [
  { id: "philosophy", label: "Philosophy" },
  { id: "art-culture", label: "Art & culture" },
  { id: "psychology", label: "Psychology" },
  { id: "technology", label: "Technology" },
  { id: "history", label: "History" },
  { id: "fiction", label: "Fiction" },
  { id: "personal-growth", label: "Personal growth" },
  { id: "society-politics", label: "Society & politics" },
];

export default function OnboardingInterests() {
  const router = useRouter();
  const { user } = useUser();
  const [selected, setSelected] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bold amber/ochre - creativity, warmth, energy (The Athletic inspired)
  const bg = "#A85D00";
  const textColor = "#FFF9F0";
  const accentColor = "#FFD9A8";
  const selectedBg = "#C47000";
  const hoverBg = "#B86600";
  const borderColor = "#D4914D";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const handleContinue = async () => {
    if (selected.length === 0 || !user) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          interests: selected,
        }),
      });
    } catch (error) {
      console.error("Failed to save preference:", error);
    }

    router.push("/onboarding/6");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden"
      style={{
        backgroundColor: bg,
        fontFamily: "var(--font-eb-garamond), serif",
      }}
    >
      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        className={`max-w-xl w-full transition-all duration-700 ease-out ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Question */}
        <h1
          className="text-3xl md:text-4xl lg:text-[2.75rem] font-normal leading-[1.2] tracking-[-0.02em] mb-5"
          style={{ color: textColor }}
        >
          What do you enjoy thinking about?
        </h1>

        {/* Micro-copy */}
        <p
          className="text-lg md:text-xl mb-12 tracking-[-0.01em]"
          style={{ color: accentColor, opacity: 0.9 }}
        >
          Select up to 3 topics.
        </p>

        {/* Options - Grid layout */}
        <div className="grid grid-cols-2 gap-3 mb-12">
          {interests.map((interest, index) => {
            const isSelected = selected.includes(interest.id);
            const isDisabled = !isSelected && selected.length >= 3;

            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                disabled={isDisabled}
                className={`text-left px-5 py-4 rounded-xl transition-all duration-250 border-[1.5px] ${
                  isDisabled ? "opacity-35 cursor-not-allowed" : ""
                }`}
                style={{
                  backgroundColor: isSelected ? selectedBg : "transparent",
                  borderColor: isSelected ? accentColor : borderColor,
                  color: textColor,
                  transitionDelay: `${index * 30}ms`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.backgroundColor = hoverBg;
                    e.currentTarget.style.borderColor = accentColor + "90";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = borderColor;
                  }
                }}
              >
                <span className="text-base md:text-lg tracking-[-0.01em] flex items-center gap-2">
                  {isSelected && (
                    <span className="text-sm font-medium">✓</span>
                  )}
                  {interest.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          disabled={selected.length === 0 || isSubmitting}
          className={`group flex items-center gap-3 text-xl transition-all duration-300 ${
            selected.length > 0 ? "hover:gap-5" : "opacity-35 cursor-not-allowed"
          }`}
          style={{ color: textColor }}
        >
          <span
            className="relative pb-1"
            style={{
              borderBottom: `1.5px solid ${textColor}`,
            }}
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </span>
          <span
            className="transition-transform duration-300 group-hover:translate-x-1 text-2xl"
            style={{ fontWeight: 300 }}
          >
            →
          </span>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-10 flex items-center gap-3">
        {[0, 1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className="transition-all duration-500 rounded-full"
            style={{
              width: step === 3 ? "28px" : "8px",
              height: "8px",
              backgroundColor: step === 3 ? textColor : `${textColor}30`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

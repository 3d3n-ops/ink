"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const options = [
  { id: "very-basic", label: "Very basic" },
  { id: "getting-better", label: "Getting better" },
  { id: "comfortable", label: "Comfortable" },
  { id: "strong", label: "Strong" },
  { id: "unsure", label: "Unsure" },
];

export default function OnboardingCurrentLevel() {
  const router = useRouter();
  const { user } = useUser();
  const [selected, setSelected] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deep royal purple - introspection, sophistication, depth
  const bg = "#1A0F2E";
  const textColor = "#F4F0FA";
  const accentColor = "#A694C6";
  const selectedBg = "#2D1B4E";
  const hoverBg = "#241640";
  const borderColor = "#3D2A5C";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    if (!selected || !user) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          writingLevel: selected,
        }),
      });
    } catch (error) {
      console.error("Failed to save preference:", error);
    }

    router.push("/onboarding/4");
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
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
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
          How would you describe your writing today?
        </h1>

        {/* Micro-copy */}
        <p
          className="text-lg md:text-xl mb-12 tracking-[-0.01em]"
          style={{ color: accentColor, opacity: 0.8 }}
        >
          This helps us tailor your experience.
        </p>

        {/* Options */}
        <div className="space-y-3 mb-12">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className="w-full text-left px-6 py-5 rounded-xl transition-all duration-250 border-[1.5px]"
              style={{
                backgroundColor: selected === option.id ? selectedBg : "transparent",
                borderColor: selected === option.id ? accentColor : borderColor,
                color: textColor,
                transitionDelay: `${index * 50}ms`,
              }}
              onMouseEnter={(e) => {
                if (selected !== option.id) {
                  e.currentTarget.style.backgroundColor = hoverBg;
                  e.currentTarget.style.borderColor = accentColor + "80";
                }
              }}
              onMouseLeave={(e) => {
                if (selected !== option.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = borderColor;
                }
              }}
            >
              <span className="text-lg md:text-xl tracking-[-0.01em]">{option.label}</span>
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          disabled={!selected || isSubmitting}
          className={`group flex items-center gap-3 text-xl transition-all duration-300 ${
            selected ? "hover:gap-5" : "opacity-35 cursor-not-allowed"
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
              width: step === 1 ? "28px" : "8px",
              height: "8px",
              backgroundColor: step === 1 ? textColor : `${textColor}30`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

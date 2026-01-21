"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const options = [
  { id: "think-deeply", label: "I think deeply but rarely write" },
  { id: "inconsistent", label: "I journal inconsistently" },
  { id: "used-to", label: "I used to write more" },
  { id: "difficult", label: "Writing feels difficult" },
  { id: "regular", label: "I write regularly" },
];

export default function OnboardingPersonalInfo() {
  const router = useRouter();
  const { user } = useUser();
  const [selected, setSelected] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deep forest green - growth, natural wisdom, calm
  const bg = "#0A2E1C";
  const textColor = "#F0F7F4";
  const accentColor = "#8FB9A2";
  const selectedBg = "#1A4D35";
  const hoverBg = "#133D2A";
  const borderColor = "#2A5C43";

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
          writingIdentity: selected,
        }),
      });
    } catch (error) {
      console.error("Failed to save preference:", error);
    }

    router.push("/onboarding/3");
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
          className="text-3xl md:text-4xl lg:text-[2.75rem] font-normal leading-[1.2] tracking-[-0.02em] mb-12"
          style={{ color: textColor }}
        >
          Which feels closest right now?
        </h1>

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
              width: step === 0 ? "28px" : "8px",
              height: "8px",
              backgroundColor: step === 0 ? textColor : `${textColor}30`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

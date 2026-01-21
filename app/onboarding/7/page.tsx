"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPaywall() {
  const router = useRouter();
  const hasTriggeredGeneration = useRef(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rich black with warm undertone - premium, conviction, weight
  const bg = "#080808";
  const textColor = "#F5F2EE";
  const accentColor = "#9A958E";
  const highlightColor = "#D4AF37"; // Classic gold - timeless premium
  const cardBg = "#141312";
  const cardBorder = "#2A2826";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Trigger prompt generation in the background
    async function triggerPromptGeneration() {
      if (hasTriggeredGeneration.current) return;
      hasTriggeredGeneration.current = true;

      try {
        const response = await fetch("/api/prompts", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Prompt generation started:", data.jobId);
        }
      } catch (error) {
        console.error("Failed to trigger prompt generation:", error);
      }
    }

    triggerPromptGeneration();
  }, []);

  const handleStartTrial = async () => {
    setIsLoading(true);
    // In a real app, this would initiate the payment/subscription flow
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden"
      style={{
        backgroundColor: bg,
        fontFamily: "var(--font-eb-garamond), serif",
      }}
    >
      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle radial gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${highlightColor}08 0%, transparent 60%)`,
        }}
      />

      <div
        className={`max-w-lg w-full transition-all duration-700 ease-out relative z-10 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-[3.25rem] font-normal leading-[1.15] tracking-[-0.02em] mb-6 text-center"
          style={{ color: textColor }}
        >
          Try Ink free for 7 days.
        </h1>

        {/* Subtext */}
        <div className="text-center mb-12 space-y-1">
          <p className="text-xl md:text-2xl tracking-[-0.01em]" style={{ color: accentColor }}>
            Build a daily writing practice.
          </p>
          <p className="text-xl md:text-2xl tracking-[-0.01em]" style={{ color: accentColor }}>
            Think more clearly.
          </p>
          <p className="text-xl md:text-2xl tracking-[-0.01em]" style={{ color: accentColor }}>
            Preserve your originality.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="flex gap-4 mb-10">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className="flex-1 p-6 rounded-2xl border-2 transition-all duration-300 text-left"
            style={{
              backgroundColor: selectedPlan === "monthly" ? cardBg : "transparent",
              borderColor: selectedPlan === "monthly" ? highlightColor : cardBorder,
            }}
          >
            <p 
              className="text-sm mb-2 tracking-wide uppercase" 
              style={{ color: accentColor, letterSpacing: "0.08em" }}
            >
              Monthly
            </p>
            <p 
              className="text-3xl md:text-4xl font-normal tracking-[-0.02em]" 
              style={{ color: textColor }}
            >
              $4.99
            </p>
            <p 
              className="text-sm mt-1" 
              style={{ color: accentColor, opacity: 0.8 }}
            >
              per month
            </p>
          </button>

          {/* Yearly */}
          <button
            onClick={() => setSelectedPlan("yearly")}
            className="flex-1 p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden"
            style={{
              backgroundColor: selectedPlan === "yearly" ? cardBg : "transparent",
              borderColor: selectedPlan === "yearly" ? highlightColor : cardBorder,
            }}
          >
            {/* Best value badge */}
            <div
              className="absolute top-0 right-0 px-4 py-1.5 text-xs font-medium tracking-wide uppercase rounded-bl-xl"
              style={{ 
                backgroundColor: highlightColor, 
                color: bg,
                letterSpacing: "0.06em" 
              }}
            >
              Best value
            </div>
            <p 
              className="text-sm mb-2 tracking-wide uppercase" 
              style={{ color: accentColor, letterSpacing: "0.08em" }}
            >
              Yearly
            </p>
            <p 
              className="text-3xl md:text-4xl font-normal tracking-[-0.02em]" 
              style={{ color: textColor }}
            >
              $9.99
            </p>
            <p 
              className="text-sm mt-1" 
              style={{ color: accentColor, opacity: 0.8 }}
            >
              per year
            </p>
          </button>
        </div>

        {/* Divider text */}
        <div
          className="border-t border-b py-8 mb-10 text-center"
          style={{ borderColor: cardBorder }}
        >
          <p 
            className="text-lg md:text-xl italic tracking-[-0.01em] mb-1" 
            style={{ color: accentColor }}
          >
            Real change requires commitment.
          </p>
          <p 
            className="text-lg md:text-xl italic tracking-[-0.01em]" 
            style={{ color: accentColor }}
          >
            Writing every day is an investment in how you think and who you become.
          </p>
        </div>

        {/* Quote */}
        <div
          className="border-l-[3px] pl-8 mb-12"
          style={{ borderColor: highlightColor }}
        >
          <p
            className="text-lg md:text-xl italic mb-2 tracking-[-0.01em]"
            style={{ color: textColor, opacity: 0.9 }}
          >
            "A word after a word after a word is power."
          </p>
          <p
            className="text-base tracking-wide uppercase"
            style={{ color: highlightColor, opacity: 0.85, letterSpacing: "0.1em" }}
          >
            — Margaret Atwood
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStartTrial}
          disabled={isLoading}
          className="w-full py-5 rounded-2xl text-xl md:text-2xl font-medium transition-all duration-300 hover:opacity-90 tracking-[-0.01em]"
          style={{
            backgroundColor: highlightColor,
            color: bg,
          }}
        >
          {isLoading ? "Starting..." : "Start free trial →"}
        </button>

        {/* Skip link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full mt-5 py-3 text-base hover:opacity-70 transition-opacity tracking-[-0.01em]"
          style={{ color: accentColor, opacity: 0.5 }}
        >
          Skip for now
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-10 flex items-center gap-3">
        {[0, 1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className="transition-all duration-500 rounded-full"
            style={{
              width: step === 5 ? "28px" : "8px",
              height: "8px",
              backgroundColor: step === 5 ? textColor : `${textColor}30`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

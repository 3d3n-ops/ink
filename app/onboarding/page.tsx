"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingIntro() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Editorial color schemes - bold, premium, NYT/Athletic inspired
  const slides = [
    {
      // Slide 1: Hard Hook (Problem) - Deep charcoal with warm undertone
      bg: "#0D1117",
      textColor: "#E8E4E0",
      accentColor: "#9CA3AF",
      headline: "We don't think as clearly as we used to.",
      subtext: ["Constant input. Little reflection.", "The mind never gets a chance to speak."],
      quote: null,
    },
    {
      // Slide 2: The Solution - Rich terracotta/burnt orange
      bg: "#9F2B00",
      textColor: "#FEF7F0",
      accentColor: "#F5D0BC",
      headline: "Writing is how you take your mind back.",
      subtext: [
        "Not for productivity.",
        "Not for performance.",
        "For clarity, self-understanding, and original thought.",
      ],
      quote: {
        text: '"Writing is thinking."',
        author: "David McCullough",
      },
    },
  ];

  const current = slides[currentSlide];

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleContinue = () => {
    if (currentSlide === 0) {
      // Transition to slide 2 with smooth fade
      setIsTransitioning(true);
      setShowContent(false);

      setTimeout(() => {
        setCurrentSlide(1);
        setIsTransitioning(false);
      }, 800);
    } else {
      // Navigate to next page
      router.push("/onboarding/2");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 transition-colors duration-1000 ease-in-out relative overflow-hidden"
      style={{
        backgroundColor: current.bg,
        fontFamily: "var(--font-eb-garamond), serif",
      }}
    >
      {/* Subtle grain overlay for editorial texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content container */}
      <div
        className={`max-w-2xl w-full transition-all duration-800 ease-out ${
          showContent && !isTransitioning
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
        style={{ transitionDuration: "800ms" }}
      >
        {/* Headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-[3.5rem] font-normal leading-[1.15] tracking-[-0.02em] mb-10"
          style={{ color: current.textColor }}
        >
          {current.headline}
        </h1>

        {/* Subtext lines */}
        <div className="space-y-1.5 mb-12">
          {current.subtext.map((line, index) => (
            <p
              key={index}
              className="text-xl md:text-2xl font-normal tracking-[-0.01em]"
              style={{ 
                color: current.accentColor,
                animationDelay: `${index * 100 + 200}ms` 
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Quote (only on slide 2) */}
        {current.quote && (
          <div
            className="border-l-[3px] pl-8 mb-12"
            style={{ borderColor: `${current.accentColor}60` }}
          >
            <p
              className="text-lg md:text-xl italic mb-2 tracking-[-0.01em]"
              style={{ color: current.textColor, opacity: 0.85 }}
            >
              {current.quote.text}
            </p>
            <p
              className="text-base tracking-wide uppercase"
              style={{ color: current.accentColor, opacity: 0.7, letterSpacing: "0.1em" }}
            >
              — {current.quote.author}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="group flex items-center gap-3 text-xl transition-all duration-300 hover:gap-5"
          style={{color:current.textColor}}
        >
          <span 
            className="relative pb-1"
            style={{ 
              borderBottom: `1.5px solid ${current.textColor}`,
            }}
          >
            Continue
          </span>
          <span 
            className="transition-transform duration-300 group-hover:translate-x-1 text-2xl"
            style={{ fontWeight: 300 }}
          >
            →
          </span>
        </button>
      </div>

      {/* Minimal slide indicator - bottom center */}
      <div className="absolute bottom-10 flex items-center gap-4">
        {slides.map((_, index) => (
          <div
            key={index}
            className="transition-all duration-500 rounded-full"
            style={{
              width: index === currentSlide ? "28px" : "8px",
              height: "8px",
              backgroundColor:
                index === currentSlide
                  ? current.textColor
                  : `${current.textColor}35`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

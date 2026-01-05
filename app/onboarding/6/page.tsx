"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import FadeInSection from "../../components/FadeInSection";
import OnboardingButton from "../../components/OnboardingButton";

const writingLevels = [
  {
    emoji: "🌱",
    level: "Beginner",
    description: "I don't write often, but I want to start",
  },
  {
    emoji: "🍀",
    level: "Hobbyist",
    description: "I write sometimes and want more consistency",
  },
  {
    emoji: "🎓",
    level: "Student",
    description: "I write for school and want to improve",
  },
  {
    emoji: "✍️",
    level: "Intermediate",
    description: "I'm comfortable writing but want depth and clarity",
  },
  {
    emoji: "🧠",
    level: "Professional",
    description: "Writing is part of my work",
  },
  {
    emoji: "🔍",
    level: "Exploring",
    description: "I'm not sure, I just want to see where this goes",
  },
];

export default function OnboardingPage6() {
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          writingLevel: selectedLevel,
        }),
      });

      if (response.ok) {
        router.push("/onboarding/7");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-8 py-16 md:px-16">
        <form onSubmit={handleSubmit} className="w-full space-y-8">
          {/* Heading */}
          <FadeInSection delay={400}>
            <h1 className="text-center text-3xl font-bold text-[#171717] md:text-4xl lg:text-5xl">
              How would you describe your writing level right now?
            </h1>
          </FadeInSection>

          {/* Subtitle */}
          <FadeInSection delay={800}>
            <p className="text-center text-lg italic text-[#171717] md:text-xl">
              This only helps us choose the right prompts — not judge you.
            </p>
          </FadeInSection>

          {/* Options */}
          <div className="mt-12 space-y-4">
            {writingLevels.map((level, index) => (
              <FadeInSection key={level.level} delay={1200 + index * 200}>
                <label
                  className={`flex cursor-pointer items-start space-x-4 rounded-lg border-2 p-4 transition-all ${
                    selectedLevel === level.level
                      ? "border-[#FEBC2F] bg-[#FEBC2F]/10"
                      : "border-transparent bg-transparent hover:border-[#FEBC2F]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="writingLevel"
                    value={level.level}
                    checked={selectedLevel === level.level}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-2xl">{level.emoji}</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-[#171717] md:text-xl">
                      {level.level}
                    </span>
                    <span className="text-base text-[#171717] md:text-lg">
                      — {level.description}
                    </span>
                  </div>
                </label>
              </FadeInSection>
            ))}
          </div>

          {/* Next button */}
          <FadeInSection delay={2400}>
            <div className="mt-12 flex justify-center">
              <button
                type="submit"
                disabled={!selectedLevel || isSubmitting}
                className="rounded-[20px] bg-[#FEBC2F] px-8 py-4 text-lg font-bold text-[#171717] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed md:px-12 md:py-5 md:text-xl"
              >
                {isSubmitting ? "Saving..." : "Next"}
              </button>
            </div>
          </FadeInSection>
        </form>
      </main>
    </div>
  );
}


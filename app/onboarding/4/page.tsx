"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import FadeInSection from "../../components/FadeInSection";
import OnboardingButton from "../../components/OnboardingButton";

const writingReasons = [
  { emoji: "🧠", text: "To think more clearly" },
  { emoji: "📓", text: "To journal and reflect on my life" },
  { emoji: "✍️", text: "To improve my storytelling or creativity" },
  { emoji: "🏫", text: "For school or academics" },
  { emoji: "💼", text: "For work (essays, emails, content, ideas)" },
  { emoji: "🌱", text: "Personal growth" },
  { emoji: "🤍", text: "Just for fun" },
  { emoji: "✨", text: "Something else (tell us)" },
];

export default function OnboardingPage4() {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          writingReason: selectedReason,
        }),
      });

      if (response.ok) {
        router.push("/onboarding/5");
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
              Why do you want to write?
            </h1>
          </FadeInSection>

          {/* Subtitle */}
          <FadeInSection delay={800}>
            <p className="text-center text-lg italic text-[#171717] md:text-xl">
              There's no wrong reason. Writing meets you where you are.
            </p>
          </FadeInSection>

          {/* Options */}
          <div className="mt-12 space-y-4">
            {writingReasons.map((reason, index) => (
              <FadeInSection key={reason.text} delay={1200 + index * 200}>
                <label
                  className={`flex cursor-pointer items-center space-x-4 rounded-lg border-2 p-4 transition-all ${
                    selectedReason === reason.text
                      ? "border-[#FEBC2F] bg-[#FEBC2F]/10"
                      : "border-transparent bg-transparent hover:border-[#FEBC2F]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="writingReason"
                    value={reason.text}
                    checked={selectedReason === reason.text}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-2xl">{reason.emoji}</span>
                  <span className="text-lg text-[#171717] md:text-xl">
                    {reason.text}
                  </span>
                </label>
              </FadeInSection>
            ))}
          </div>

          {/* Next button */}
          <FadeInSection delay={2800}>
            <div className="mt-12 flex justify-center">
              <button
                type="submit"
                disabled={!selectedReason || isSubmitting}
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


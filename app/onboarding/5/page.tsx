"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import FadeInSection from "../../components/FadeInSection";
import OnboardingButton from "../../components/OnboardingButton";

const interests = [
  { emoji: "📓", text: "Personal journaling" },
  { emoji: "🧠", text: "Thoughts, ideas & reflections" },
  { emoji: "🤍", text: "Mental health & emotions" },
  { emoji: "⚛️", text: "Philosophy & deep thinking" },
  { emoji: "🤖", text: "Technology & AI" },
  { emoji: "💼", text: "Business, money & ambition" },
  { emoji: "🎨", text: "Creativity & storytelling" },
  { emoji: "📝", text: "Poetry" },
  { emoji: "🎵", text: "Music, art & film" },
  { emoji: "🌍", text: "Culture & society" },
  { emoji: "🙏", text: "Faith & spirituality" },
  { emoji: "❤️", text: "Relationships & love" },
  { emoji: "✈️", text: "Travel & experiences" },
  { emoji: "🤸", text: "Fitness & health" },
  { emoji: "🌊", text: "Stream of consciousness / random thoughts" },
];

export default function OnboardingPage5() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          interests: selectedInterests,
        }),
      });

      if (response.ok) {
        router.push("/onboarding/6");
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
              What are your current interests?
            </h1>
          </FadeInSection>

          {/* Subtitle */}
          <FadeInSection delay={800}>
            <p className="text-center text-lg italic text-[#171717] md:text-xl">
              You don't have to know your 'thing' yet. Writing helps you find it.
            </p>
          </FadeInSection>

          {/* Interests grid */}
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {interests.map((interest, index) => (
              <FadeInSection key={interest.text} delay={1200 + index * 100}>
                <label
                  className={`flex cursor-pointer items-center space-x-4 rounded-lg border-2 p-4 transition-all ${
                    selectedInterests.includes(interest.text)
                      ? "border-[#FEBC2F] bg-[#FEBC2F]/10"
                      : "border-transparent bg-transparent hover:border-[#FEBC2F]/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInterests.includes(interest.text)}
                    onChange={() => toggleInterest(interest.text)}
                    className="hidden"
                  />
                  <span className="text-2xl">{interest.emoji}</span>
                  <span className="text-lg text-[#171717] md:text-xl">
                    {interest.text}
                  </span>
                </label>
              </FadeInSection>
            ))}
          </div>

          {/* Next button */}
          <FadeInSection delay={2700}>
            <div className="mt-12 flex justify-center">
              <button
                type="submit"
                disabled={selectedInterests.length === 0 || isSubmitting}
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


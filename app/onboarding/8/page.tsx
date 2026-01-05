"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FadeInSection from "../../components/FadeInSection";

export default function OnboardingPage8() {
  const router = useRouter();
  const hasTriggeredGeneration = useRef(false);

  useEffect(() => {
    // Trigger prompt generation in the background
    // This starts the AI agents working on personalized writing prompts
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
        // Silently fail - prompts will be generated later
        console.error("Failed to trigger prompt generation:", error);
      }
    }
    
    triggerPromptGeneration();

    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-8 py-16 md:px-16">
        <div className="w-full space-y-8 text-center">
          {/* Heading */}
          <FadeInSection delay={400}>
            <p className="text-3xl italic text-[#171717] md:text-4xl lg:text-5xl">
              Now you're all set,<br />
              let's begin writing!
            </p>
          </FadeInSection>

          {/* Button */}
          <FadeInSection delay={1000}>
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-[20px] bg-[#FEBC2F] px-8 py-4 text-lg font-bold text-[#171717] transition-opacity hover:opacity-90 md:px-12 md:py-5 md:text-xl"
              >
                Begin
              </button>
            </div>
          </FadeInSection>
        </div>
      </main>
    </div>
  );
}


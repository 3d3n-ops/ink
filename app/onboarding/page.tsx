"use client";

import FadeInSection from "../components/FadeInSection";
import OnboardingButton from "../components/OnboardingButton";

export default function OnboardingPage1() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-8 py-16 md:px-16">
        <div className="w-full space-y-8 text-center">
          {/* Quote */}
          <FadeInSection delay={400}>
            <p className="text-3xl italic text-[#171717] md:text-4xl lg:text-5xl">
              Writing is thinking on<br />
              paper. Reading is thinking<br />
              with someone else
            </p>
          </FadeInSection>

          {/* Attribution */}
          <FadeInSection delay={1000}>
            <p className="text-lg italic text-[#171717] md:text-xl">
              – adapted from William Zinser & C.S<br />
              Lewis
            </p>
          </FadeInSection>

          {/* Paragraphs */}
          <div className="mt-12 flex justify-center">
            <div className="space-y-6 text-left max-w-2xl">
              <FadeInSection delay={1800}>
                <p className="text-lg text-[#171717] md:text-xl">
                  Both are quietly fading today.
                </p>
              </FadeInSection>
              <FadeInSection delay={2400}>
                <p className="text-lg text-[#171717] md:text-xl">
                  Few people read for pleasure than any<br />
                  point in recent decades.
                </p>
              </FadeInSection>
              <FadeInSection delay={3000}>
                <p className="text-lg text-[#171717] md:text-xl">
                  Daily writing has been replaced by<br />
                  short posts, fast replies, and AI-<br />
                  generated texts.
                </p>
              </FadeInSection>
            </div>
          </div>

          {/* Next button */}
          <FadeInSection delay={3600}>
            <div className="mt-12 flex justify-center">
              <OnboardingButton href="/onboarding/2">Next</OnboardingButton>
            </div>
          </FadeInSection>
        </div>
      </main>
    </div>
  );
}


"use client";

import FadeInSection from "../../components/FadeInSection";
import OnboardingButton from "../../components/OnboardingButton";

export default function OnboardingPage2() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-8 py-16 md:px-16">
        <div className="w-full space-y-8 text-center">
          {/* Heading */}
          <FadeInSection delay={400}>
            <p className="text-3xl italic text-[#171717] md:text-4xl lg:text-5xl">
              The result?
            </p>
          </FadeInSection>

          {/* Statements */}
          <div className="mt-12 space-y-6">
            <FadeInSection delay={1000}>
              <p className="text-lg text-[#171717] md:text-xl">
                Shorter attention spans.
              </p>
            </FadeInSection>
            <FadeInSection delay={1800}>
              <p className="text-lg text-[#171717] md:text-xl">
                Weaker critical thinking.
              </p>
            </FadeInSection>
            <FadeInSection delay={2400}>
              <p className="text-lg text-[#171717] md:text-xl">
                And more of our thinking <span className="italic">outsourced to machines.</span>
              </p>
            </FadeInSection>
          </div>

          {/* Concluding statement */}
          <div className="mt-12 space-y-4">
            <FadeInSection delay={3000}>
              <p className="text-lg text-[#171717] md:text-xl">
                Ink exists for one reason:
              </p>
            </FadeInSection>
            <FadeInSection delay={3600}>
              <p className="text-lg text-[#171717] md:text-xl">
                to revive writing as a daily practice of<br />
                self-expression and clear thought.
              </p>
            </FadeInSection>
          </div>

          {/* Next button */}
          <FadeInSection delay={4200}>
            <div className="mt-12 flex justify-center">
              <OnboardingButton href="/onboarding/3">Next</OnboardingButton>
            </div>
          </FadeInSection>
        </div>
      </main>
    </div>
  );
}


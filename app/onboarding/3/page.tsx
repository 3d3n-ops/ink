"use client";

import FadeInSection from "../../components/FadeInSection";
import OnboardingButton from "../../components/OnboardingButton";

export default function OnboardingPage3() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-8 py-16 md:px-16">
        <div className="w-full space-y-8 text-center">
          {/* Large italicized heading */}
          <FadeInSection delay={400}>
            <p className="text-3xl italic text-[#171717] md:text-4xl lg:text-5xl">
              Ink isn't about perfection. It's<br />
              not about becoming a<br />
              novelist or being a<br />
              performative writer.
            </p>
          </FadeInSection>

          {/* Paragraphs */}
          <div className="mt-12 space-y-6">
            <FadeInSection delay={1200}>
              <p className="text-lg text-[#171717] md:text-xl">
                It's about showing up daily, exploring<br />
                ideas you care about, looking<br />
                introspectively through mindful<br />
                writing, and discovering your voice<br />
                through practice.
              </p>
            </FadeInSection>
            <FadeInSection delay={2400}>
              <p className="text-lg text-[#171717] md:text-xl">
                That said, let's make this personal.
              </p>
            </FadeInSection>
          </div>

          {/* Next button */}
          <FadeInSection delay={3200}>
            <div className="mt-12 flex justify-center">
              <OnboardingButton href="/onboarding/4">Next</OnboardingButton>
            </div>
          </FadeInSection>
        </div>
      </main>
    </div>
  );
}


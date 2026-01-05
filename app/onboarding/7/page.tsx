"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FadeInSection from "../../components/FadeInSection";

export default function OnboardingPage7() {
  const router = useRouter();

  useEffect(() => {
    // Skip this page and go directly to final page
    router.push("/onboarding/8");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-8 py-16 md:px-16">
        <FadeInSection delay={400}>
          <p className="text-center text-lg text-[#171717] md:text-xl">
            Redirecting...
          </p>
        </FadeInSection>
      </main>
    </div>
  );
}


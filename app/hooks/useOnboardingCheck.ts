"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useOnboardingCheck() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const response = await fetch("/api/onboarding/status");
        if (response.ok) {
          const data = await response.json();
          if (!data.completed) {
            router.replace("/onboarding");
            return;
          }
          setIsOnboarded(true);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        // On error, allow access (fail open for better UX)
        setIsOnboarded(true);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboarding();
  }, [router]);

  return { isChecking, isOnboarded };
}


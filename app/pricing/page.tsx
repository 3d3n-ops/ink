"use client";

import { LandingHeader } from "../components/LandingHeader";
import { LandingFooter } from "../components/LandingFooter";
import { TrialProgressMap } from "../components/TrialProgressMap";

export default function PricingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#FFFAF0",
        fontFamily: "var(--font-figtree), sans-serif",
      }}
    >
      {/* Header */}
      <LandingHeader />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-20">
        <div className="max-w-md w-full text-center">
          {/* Caption */}
          <h1
            className="text-4xl sm:text-5xl text-[#171717] mb-3"
            style={{ fontFamily: "var(--font-eb-garamond), serif" }}
          >
            Try Ink for free
          </h1>
          <p className="text-[#171717]/60 text-lg mb-10">
            Start your 7-day free trial today
          </p>

          {/* Trial Progress Map */}
          <TrialProgressMap />

          {/* Pricing info */}
          <div className="mt-10 mb-6">
            <p className="text-[#171717]/60 text-sm">
              7-day free trial, then{" "}
              <span className="text-[#171717] font-medium">$4.99 per month</span>
            </p>
          </div>

          {/* CTA Button */}
          <button
            className="w-full py-4 px-6 rounded-full text-[#171717] font-medium text-lg transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "#FEBC2F" }}
          >
            Start your 7-day free trial
          </button>

          {/* Terms */}
          <p className="mt-4 text-[#171717]/40 text-xs">
            Cancel anytime. No commitment required.
          </p>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}

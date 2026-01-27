"use client";

import { useState } from "react";

type Feature = {
  id: string;
  title: string;
  titleWords: string[];
  description: string;
};

const features: Feature[] = [
  {
    id: "write-freely",
    title: "A beautiful, minimalist writing space",
    titleWords: ["Simple","writing", "space"],
    description:
      "A clean, distraction-free text editor that feels like paper — so your thoughts can unfold without interruption.",
  },
  {
    id: "be-creative",
    title: "Prompts that meet you where you are",
    titleWords: ["Prompts", "that", "meet", "you"],
    description:
      "Daily writing prompts based on what you care about, helping you explore ideas you might never have put into words.",
  },
  {
    id: "build-habit",
    title: "Stay consistent, without pressure",
    titleWords: ["Stay", "consistent,", "without", "pressure"],
    description:
      "Gentle reminders and streaks that help you build a writing habit that lasts.",
  },
  {
    id: "express-yourself",
    title: "Express yourself freely",
    titleWords: ["Express", "yourself", "freely"],
    description:
      "Share your thoughts with the world or keep them private. Create and publish your writing journey.",
  },
];

const tabs = [
  { id: "write-freely", label: "Write freely" },
  { id: "be-creative", label: "Be creative" },
  { id: "build-habit", label: "Build a habit" },
  { id: "express-yourself", label: "Express yourself" },
];

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState("write-freely");
  const activeFeature = features.find((f) => f.id === activeTab) || features[0];

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24"
    >
      {/* Tab Navigation */}
      <div className="flex justify-center mb-12 sm:mb-16">
        <div className="flex gap-6 sm:gap-8 md:gap-10 flex-wrap justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm sm:text-base font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-[#161210] font-semibold"
                  : "text-[#161210]/50 hover:text-[#161210]/70"
              }`}
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Content Card - Opennote Style */}
      <div className="flex justify-center">
        <div
          className="w-full max-w-[1258px] h-auto lg:h-[641px] min-h-[500px] lg:min-h-[641px] rounded-[24px] overflow-hidden flex flex-col lg:flex-row"
          style={{ boxShadow: "0 4px 24px rgba(22, 18, 16, 0.08)" }}
        >
          {/* Left Panel - Colored Background with Text */}
          <div className="w-full lg:w-[35%] bg-[#F7EADC] flex flex-col justify-center px-8 lg:px-12 py-12 lg:py-16">
            <h3
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#161210] leading-tight mb-6"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              {activeFeature.titleWords.map((word, index) => (
                <span key={index}>
                  {word}
                  {index < activeFeature.titleWords.length - 1 && <br />}
                </span>
              ))}
            </h3>
            <p
              className="text-base sm:text-lg text-[#161210] leading-relaxed max-w-sm"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              {activeFeature.description}
            </p>
          </div>

          {/* Right Panel - White Card with Demo Video */}
          <div className="w-full lg:w-[65%] bg-white flex items-center justify-center p-6 lg:p-8 relative">
            <div
              className="w-full h-full min-h-[400px] lg:min-h-[545px] rounded-[20px] bg-white border border-[#161210]/8 flex items-center justify-center relative"
              style={{
                boxShadow: "0 2px 16px rgba(22, 18, 16, 0.06)",
              }}
            >
              <p
                className="text-sm text-[#161210]/40"
                style={{ fontFamily: "var(--font-figtree), sans-serif" }}
              >
                Demo video placeholder
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

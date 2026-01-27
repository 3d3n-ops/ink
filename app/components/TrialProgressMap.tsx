"use client";

import { CheckCircle, Bell, Play, CreditCard } from "lucide-react";

interface TrialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  day: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

const trialSteps: TrialStep[] = [
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: "Start your free trial",
    description: "Get full access to all features and prompts",
    day: "Today",
    isActive: true,
  },
  {
    icon: <Play className="w-5 h-5" />,
    title: "Explore & write freely",
    description: "Unlimited journaling with AI-powered prompts",
    day: "Day 1-7",
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: "Trial reminder",
    description: "We'll send you an email reminder before your trial ends",
    day: "Day 5",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Trial ends",
    description: "You'll be charged and your subscription will begin. Cancel anytime before.",
    day: "Day 7",
  },
];

export function TrialProgressMap() {
  return (
    <div className="relative">
      {trialSteps.map((step, index) => (
        <div key={index} className="flex items-start gap-4 relative">
          {/* Timeline */}
          <div className="flex flex-col items-center">
            {/* Icon circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                step.isActive
                  ? "bg-[#FEBC2F] text-[#171717]"
                  : "bg-[#F7EADC] text-[#171717]/40"
              }`}
            >
              {step.icon}
            </div>
            {/* Connecting line */}
            {index < trialSteps.length - 1 && (
              <div
                className={`w-0.5 h-16 ${
                  step.isActive || step.isCompleted
                    ? "bg-[#FEBC2F]"
                    : "bg-[#E8E0D5]"
                }`}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  step.isActive
                    ? "bg-[#FEBC2F]/20 text-[#171717]"
                    : "bg-[#E8E0D5] text-[#171717]/60"
                }`}
              >
                {step.day}
              </span>
            </div>
            <h3
              className="text-[#171717] font-medium text-base mb-1"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              {step.title}
            </h3>
            <p className="text-[#171717]/60 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

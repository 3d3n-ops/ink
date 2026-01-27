"use client";

import Sidebar from "../components/Sidebar";
import { useOnboardingCheck } from "../hooks/useOnboardingCheck";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Placeholder data for published writings on Ink
const featuredWritings = [
  {
    id: "1",
    title: "The Art of Thinking Clearly",
    author: "Sarah Chen",
    excerpt: "How daily writing transformed my decision-making process...",
    date: "Jan 3, 2026",
  },
  {
    id: "2", 
    title: "Letters to My Future Self",
    author: "Marcus Williams",
    excerpt: "A collection of reflections written over five years of journaling...",
    date: "Jan 2, 2026",
  },
  {
    id: "3",
    title: "Finding Voice in Silence",
    author: "Aisha Patel",
    excerpt: "What I learned from 100 days of morning pages...",
    date: "Jan 1, 2026",
  },
];

const recentWritings = [
  {
    id: "4",
    title: "On Creative Blocks",
    author: "James Liu",
    date: "Dec 31, 2025",
  },
  {
    id: "5",
    title: "Digital Minimalism in Practice",
    author: "Emma Rodriguez",
    date: "Dec 30, 2025",
  },
  {
    id: "6",
    title: "The Slow Morning Ritual",
    author: "David Kim",
    date: "Dec 29, 2025",
  },
  {
    id: "7",
    title: "Writing Through Grief",
    author: "Nina Okonkwo",
    date: "Dec 28, 2025",
  },
  {
    id: "8",
    title: "Lessons from My Grandmother",
    author: "Carlos Mendez",
    date: "Dec 27, 2025",
  },
];

const topics = [
  "Personal Growth",
  "Creativity",
  "Mindfulness",
  "Relationships",
  "Career",
  "Health",
  "Philosophy",
  "Travel",
];

export default function ExplorePage() {
  const { isChecking, isOnboarded } = useOnboardingCheck();

  // Show loading while checking onboarding status
  if (isChecking || !isOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
        <div className="animate-pulse text-[#171717]/40">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#FFFAF0]">
        <Sidebar />

        {/* Main Content Area */}
        <SidebarInset className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-10 flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold text-[#171717] mb-2 md:text-4xl">
                  Explore
                </h1>
                <p className="text-sm text-[#171717]/60 md:text-base">
                  Discover writings from the Ink community
                </p>
              </div>
            </div>

          {/* Topics */}
          <section className="mb-10">
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium text-[#171717]/70 bg-[#171717]/5 rounded-full hover:bg-[#FEBC2F]/20 hover:text-[#171717] transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </section>

          {/* Featured Writings */}
          <section className="mb-12">
            <h2 className="text-lg font-bold text-[#171717] mb-4 md:text-xl">
              Featured
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredWritings.map((writing) => (
                <article
                  key={writing.id}
                  className="group cursor-pointer"
                >
                  {/* Placeholder Image */}
                  <div className="w-full aspect-[4/3] bg-gray-200 rounded-lg mb-3 group-hover:bg-gray-300 transition-colors" />
                  
                  {/* Content */}
                  <h3 className="text-sm font-bold text-[#171717] mb-1 group-hover:text-[#FEBC2F] transition-colors md:text-base">
                    {writing.title}
                  </h3>
                  <p className="text-xs text-[#171717]/60 mb-2 line-clamp-2">
                    {writing.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#171717]/50">
                    <span className="font-medium">{writing.author}</span>
                    <span>·</span>
                    <span>{writing.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Recent Writings */}
          <section className="mb-12">
            <h2 className="text-lg font-bold text-[#171717] mb-4 md:text-xl">
              Recent
            </h2>
            <div className="space-y-1">
              {recentWritings.map((writing) => (
                <article
                  key={writing.id}
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-[#171717]/5 cursor-pointer transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-medium text-[#171717] md:text-base">
                      {writing.title}
                    </h3>
                    <span className="text-xs text-[#171717]/50">
                      {writing.author}
                    </span>
                  </div>
                  <span className="text-xs text-[#171717]/40">
                    {writing.date}
                  </span>
                </article>
              ))}
            </div>
          </section>

          {/* Coming Soon Notice */}
          <section className="text-center py-8 border-t border-[#171717]/10">
            <p className="text-sm text-[#171717]/40 italic">
              More writings coming soon as the Ink community grows...
            </p>
          </section>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


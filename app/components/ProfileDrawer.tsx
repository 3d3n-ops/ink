"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  name: string;
  interests: string[];
  activityGraph: { date: string; count: number }[];
  insights: {
    totalEntries: number;
    totalWords: number;
    avgWordsPerEntry: number;
    avgTimeSpent: number;
    mostWordsWritten: number;
    longestStreak: number;
  };
}

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchProfileData();
    }
  }, [open]);

  async function fetchProfileData() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate activity levels for color coding (GitHub-style)
  function getActivityColor(count: number): string {
    if (count === 0) return "bg-[#171717]/5";
    if (count === 1) return "bg-[#FEBC2F]/30";
    if (count <= 3) return "bg-[#FEBC2F]/50";
    return "bg-[#FEBC2F]";
  }

  // Get weeks for the activity graph (52 weeks)
  function getWeeks() {
    const weeks: { date: string; count: number }[][] = [];
    const data = profileData?.activityGraph || [];
    
    // Group by weeks (7 days per week)
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7));
    }
    
    return weeks;
  }

  const weeks = getWeeks();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-[#171717]/10">
          <DrawerTitle className="text-2xl font-bold text-[#171717]">
            Profile
          </DrawerTitle>
          <DrawerDescription className="text-[#171717]/60">
            Your writing journey and insights
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : profileData ? (
            <>
              {/* User Name */}
              <section>
                <h2 className="text-xl font-semibold text-[#171717] mb-2">
                  {profileData.name}
                </h2>
              </section>

              {/* Interests */}
              {profileData.interests.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-[#171717]/60 uppercase tracking-wide mb-3">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 text-sm font-medium text-[#171717] bg-[#FEBC2F]/20 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Activity Graph */}
              <section>
                <h3 className="text-sm font-medium text-[#171717]/60 uppercase tracking-wide mb-3">
                  Writing Activity
                </h3>
                <div className="flex gap-1 items-end">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`w-3 h-3 rounded-sm ${getActivityColor(day.count)}`}
                          title={`${day.date}: ${day.count} ${day.count === 1 ? "entry" : "entries"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-[#171717]/40">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-[#171717]/5" />
                    <div className="w-3 h-3 rounded-sm bg-[#FEBC2F]/30" />
                    <div className="w-3 h-3 rounded-sm bg-[#FEBC2F]/50" />
                    <div className="w-3 h-3 rounded-sm bg-[#FEBC2F]" />
                  </div>
                  <span>More</span>
                </div>
              </section>

              {/* Insights */}
              <section>
                <h3 className="text-sm font-medium text-[#171717]/60 uppercase tracking-wide mb-4">
                  Insights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#171717]/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#171717]">
                      {profileData.insights.totalEntries}
                    </div>
                    <div className="text-sm text-[#171717]/60 mt-1">
                      Total Entries
                    </div>
                  </div>
                  <div className="p-4 bg-[#171717]/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#171717]">
                      {profileData.insights.totalWords.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#171717]/60 mt-1">
                      Total Words
                    </div>
                  </div>
                  <div className="p-4 bg-[#171717]/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#171717]">
                      {profileData.insights.avgWordsPerEntry}
                    </div>
                    <div className="text-sm text-[#171717]/60 mt-1">
                      Avg Words/Entry
                    </div>
                  </div>
                  <div className="p-4 bg-[#171717]/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#171717]">
                      {profileData.insights.mostWordsWritten.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#171717]/60 mt-1">
                      Most Words Written
                    </div>
                  </div>
                  <div className="p-4 bg-[#171717]/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#171717]">
                      {profileData.insights.avgTimeSpent}
                    </div>
                    <div className="text-sm text-[#171717]/60 mt-1">
                      Avg Minutes/Entry
                    </div>
                  </div>
                  <div className="p-4 bg-[#171717]/5 rounded-lg">
                    <div className="text-2xl font-bold text-[#171717]">
                      {profileData.insights.longestStreak}
                    </div>
                    <div className="text-sm text-[#171717]/60 mt-1">
                      Longest Streak (days)
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-8 text-[#171717]/40">
              Failed to load profile data
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

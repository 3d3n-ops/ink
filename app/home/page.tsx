"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const featuredEntries = [
    { title: "Performative christianity", id: "1" },
    { title: "Modern software & AI", id: "2" },
    { title: "2026 Dating scene predictions", id: "3" },
  ];

  const writings = [
    { title: "My first journal", date: "1/1/26", id: "1" },
  ];

  return (
    <div className="flex min-h-screen bg-[#FFFAF0]">
      {/* Left Sidebar Navigation */}
      <aside className="w-48 border-r border-[#171717]/10 p-8">
        <nav className="flex flex-col space-y-6">
          <Link
            href="/home"
            className="text-lg font-bold text-[#171717] hover:text-[#FEBC2F] transition-colors"
          >
            Home
          </Link>
          <Link
            href="/write"
            className="text-lg font-bold text-[#171717] hover:text-[#FEBC2F] transition-colors"
          >
            Write
          </Link>
          <Link
            href="/explore"
            className="text-lg font-bold text-[#171717] hover:text-[#FEBC2F] transition-colors"
          >
            Explore
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 lg:p-16">
        <div className="max-w-6xl mx-auto">
          {/* Ink Title */}
          <h1 className="text-6xl font-bold text-[#171717] mb-12 md:text-7xl lg:text-8xl">
            ink
          </h1>

          {/* Featured Entries Section */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {featuredEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col">
                  {/* Placeholder box */}
                  <div className="w-full aspect-[4/3] bg-gray-300 rounded-lg mb-3"></div>
                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#171717] md:text-xl">
                    {entry.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Writings Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#171717] mb-6 md:text-3xl">
              Writings
            </h2>
            <div className="space-y-4">
              {writings.map((writing) => (
                <div
                  key={writing.id}
                  className="flex items-center justify-between py-2 hover:opacity-70 transition-opacity cursor-pointer"
                >
                  <span className="text-lg text-[#171717] md:text-xl">
                    {writing.title}
                  </span>
                  <span className="text-base text-[#171717]/70 md:text-lg">
                    {writing.date}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* New Entry Button - Fixed bottom right */}
          <div className="fixed bottom-8 right-8">
            <button
              onClick={() => router.push("/write")}
              className="rounded-[20px] bg-[#FEBC2F] px-6 py-3 text-base font-bold text-[#171717] transition-opacity hover:opacity-90 shadow-lg md:px-8 md:py-4 md:text-lg"
            >
              New entry
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}


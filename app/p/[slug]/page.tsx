"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function EntryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEntry() {
      if (!slug) return;
      
      try {
        const response = await fetch(`/api/entries/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setEntry(data.entry);
        } else if (response.status === 404) {
          setError("Entry not found");
        } else {
          setError("Failed to load entry");
        }
      } catch (err) {
        console.error("Failed to fetch entry:", err);
        setError("Failed to load entry");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntry();
  }, [slug]);

  return (
    <div className="flex min-h-screen bg-[#FFFAF0]">
      <Sidebar />

      {/* Main Content Area - Centered like Substack */}
      <main className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-[#FFFAF0] border-b border-[#171717]/5">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#171717]/60 hover:text-[#171717] transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Edit Button */}
            {entry && (
              <button
                onClick={() => router.push(`/write?edit=${slug}`)}
                className="flex items-center gap-2 text-sm text-[#171717]/60 hover:text-[#171717] transition-colors"
                title="Edit entry"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex justify-center">
          <article className="w-full max-w-3xl px-6 py-12">
            {isLoading ? (
              <p className="text-[#171717]/40 italic">Loading...</p>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-[#171717]/60 mb-4">{error}</p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-[#FEBC2F] hover:underline"
                >
                  Return to dashboard
                </button>
              </div>
            ) : entry ? (
              <>
                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-[#171717] mb-4">
                  {entry.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-[#171717]/50 mb-8 pb-8 border-b border-[#171717]/10">
                  <span>{formatDate(entry.createdAt)}</span>
                  <span>·</span>
                  <span className="text-[#171717]/40">/{entry.slug}</span>
                </div>

                {/* Content */}
                <div 
                  className="entry-content prose prose-lg max-w-none text-[#171717]"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />

                {/* Styles matching the editor for consistent formatting */}
                <style jsx global>{`
                  .entry-content {
                    line-height: 1.7;
                  }
                  .entry-content h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    line-height: 1.2;
                  }
                  .entry-content h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                    line-height: 1.3;
                  }
                  .entry-content h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    line-height: 1.4;
                  }
                  .entry-content p {
                    margin-bottom: 0.75rem;
                    line-height: 1.7;
                  }
                  .entry-content ul,
                  .entry-content ol {
                    padding-left: 1.5rem;
                    margin-bottom: 0.75rem;
                  }
                  .entry-content li {
                    margin-bottom: 0.25rem;
                  }
                  .entry-content blockquote {
                    border-left: 3px solid #FEBC2F;
                    padding-left: 1rem;
                    margin-left: 0;
                    margin-bottom: 0.75rem;
                    font-style: italic;
                    color: #171717;
                    opacity: 0.8;
                  }
                  .entry-content code {
                    background: #171717;
                    color: #FEBC2F;
                    padding: 0.15rem 0.4rem;
                    border-radius: 4px;
                    font-family: ui-monospace, monospace;
                    font-size: 0.9em;
                  }
                  .entry-content pre {
                    background: #171717;
                    color: #f8f8f2;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                    overflow-x: auto;
                  }
                  .entry-content pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                  }
                  .entry-content mark {
                    background: #FEBC2F;
                    color: #171717;
                    padding: 0.1rem 0.2rem;
                    border-radius: 2px;
                  }
                  .entry-content hr {
                    border: none;
                    border-top: 2px solid #171717;
                    opacity: 0.1;
                    margin: 1.5rem 0;
                  }
                  .entry-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 1rem 0;
                  }
                  .entry-content a {
                    color: #FEBC2F;
                    text-decoration: underline;
                    cursor: pointer;
                  }
                  .entry-content a:hover {
                    opacity: 0.8;
                  }
                `}</style>
              </>
            ) : null}
          </article>
        </div>
      </main>
    </div>
  );
}


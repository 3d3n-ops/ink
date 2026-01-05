import { SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-start justify-center px-8 py-16 md:px-16">
        <div className="w-full space-y-8">
          {/* Title */}
          <h1 className="text-7xl font-bold text-[#171717] md:text-8xl lg:text-9xl">
            ink
          </h1>
          
          {/* Pronunciation */}
          <p className="text-xl italic text-[#171717] md:text-2xl">
            /iNGk/
          </p>
          
          {/* Part of speech */}
          <p className="text-lg text-[#171717] md:text-xl">
            noun
          </p>
          
          {/* Definitions */}
          <ol className="ml-6 list-decimal space-y-4 text-lg italic text-[#171717] md:text-xl">
            <li>A place to think in words.</li>
            <li>A writing platform for daily journaling, free-writing, and guided exercises.</li>
            <li>A practice for turning thoughts into clarity — one page at a time.</li>
          </ol>
          
          {/* Descriptive paragraphs */}
          <div className="mt-12 space-y-6 text-lg text-[#171717] md:text-xl">
            <p>
              Great thinking comes from great writing.
            </p>
            <p>
              Become a better writer through daily journaling, free-writing, and writing exercises on topics you care about — or ones you've never tried before.
            </p>
            <p>
              Write privately, or share your work on Ink, Substack, Medium, X, or anywhere words are read.
            </p>
          </div>
          
          {/* Start writing button */}
          <div className="mt-12 flex justify-center">
            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
              <button className="rounded-[20px] bg-[#FEBC2F] px-8 py-4 text-lg font-bold text-[#171717] transition-opacity hover:opacity-90 md:px-12 md:py-5 md:text-xl">
                Start writing
              </button>
            </SignInButton>
          </div>
        </div>
      </main>
    </div>
  );
}

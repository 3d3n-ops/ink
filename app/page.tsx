import { SignInButton } from "@clerk/nextjs";
import FlowerLogo from "./components/FlowerLogo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0]" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
      <main className="flex flex-col items-start px-8">
        <div className="flex flex-col items-start space-y-4">
          {/* Title */}
          <h1 className="text-5xl font-bold text-[#171717] md:text-6xl" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
            ink
          </h1>
          
          {/* Tagline with flower icon */}
          <div className="flex items-baseline gap-2">
            <p className="text-base text-[#171717] md:text-lg" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
              Change your life by writing <span className="italic">everyday</span>.
            </p>
            <FlowerLogo />
          </div>
          
          {/* Start writing button */}
          <div className="mt-2">
            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
              <button className="rounded-lg bg-[#FEBC2F] px-6 py-2 text-sm font-bold text-[#171717] transition-opacity hover:opacity-90 md:px-7 md:py-2.5 md:text-base" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
                Start writing
              </button>
            </SignInButton>
          </div>
        </div>
      </main>
    </div>
  );
}

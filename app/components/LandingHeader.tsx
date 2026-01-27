"use client";

import Link from "next/link";

export function LandingHeader() {
  return (
    <nav className="w-full border-b border-[#161210]/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-[#161210]"
            style={{ fontFamily: "var(--font-eb-garamond), serif" }}
          >
            ink
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/landing#features"
              className="text-sm font-medium text-[#161210] transition-colors hover:text-[#161210]/80"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[#161210] transition-colors hover:text-[#161210]/80"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-[#161210] transition-colors hover:text-[#161210]/80"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              Blog
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[#161210] transition-colors hover:text-[#161210]/80"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-[#161210] px-4 py-2 text-sm font-medium text-[#FFFAF0] transition-colors hover:bg-[#161210]/90"
              style={{ fontFamily: "var(--font-figtree), sans-serif" }}
            >
              Sign-up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

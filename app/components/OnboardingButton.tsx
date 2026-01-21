"use client";

import Link from "next/link";

interface OnboardingButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function OnboardingButton({
  href,
  children,
}: OnboardingButtonProps) {
  return (
    <Link href={href}>
      <button className="rounded-lg bg-[#FEBC2F] px-6 py-2 text-sm font-bold text-[#171717] transition-opacity hover:opacity-90 md:px-7 md:py-2.5 md:text-base" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
        {children}
      </button>
    </Link>
  );
}


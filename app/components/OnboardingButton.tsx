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
      <button className="rounded-[20px] bg-[#FEBC2F] px-8 py-4 text-lg font-bold text-[#171717] transition-opacity hover:opacity-90 md:px-12 md:py-5 md:text-xl">
        {children}
      </button>
    </Link>
  );
}


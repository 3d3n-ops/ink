"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/write", label: "Write" },
  { href: "/explore", label: "Explore" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-24 border-r border-[#171717]/10 p-4 flex flex-col">
      <nav className="flex flex-col space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-bold transition-colors ${
                isActive
                  ? "text-[#FEBC2F]"
                  : "text-[#171717] hover:text-[#FEBC2F]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


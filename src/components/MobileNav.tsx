"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconFeed, IconExplore, IconTrending, IconPortfolio } from "./Icons";

function PlusIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const navItems = [
  { label: "Feed", href: "/feed", icon: IconFeed },
  { label: "Explore", href: "/explore", icon: IconExplore },
  { label: "create", href: "/create", icon: null },
  { label: "Trending", href: "/trending", icon: IconTrending },
  { label: "Portfolio", href: "/portfolio", icon: IconPortfolio },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[480px] mx-auto flex items-center justify-around py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] border-t border-border bg-bg-elevated/95 backdrop-blur-xl">
      {navItems.map((item) => {
        if (item.label === "create") {
          return (
            <Link
              key="create"
              href={item.href}
              className="flex items-center justify-center w-10 h-10 -mt-4 rounded-full bg-accent text-white shadow-lg shadow-accent/25"
            >
              <PlusIcon />
            </Link>
          );
        }

        const active = pathname === item.href || (item.href === "/feed" && pathname === "/");
        const Icon = item.icon!;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
              active ? "text-fg" : "text-fg-tertiary"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}

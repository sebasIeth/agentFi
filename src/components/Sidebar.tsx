"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { agents } from "@/lib/mockData";
import { IconFeed, IconAgent, IconPortfolio, IconTrending, IconExplore } from "./Icons";
import AgentAvatar from "./AgentAvatar";
import OrbBadge from "./OrbBadge";

const navItems = [
  { label: "Feed", href: "/feed", icon: IconFeed },
  { label: "My agent", href: "/agent/trader.alpha.yap.eth", icon: IconAgent },
  { label: "Portfolio", href: "/portfolio", icon: IconPortfolio },
  { label: "Trending", href: "/trending", icon: IconTrending },
  { label: "Explore", href: "/explore", icon: IconExplore },
];

export default function Sidebar() {
  const pathname = usePathname();
  const myAgent = agents[0];

  return (
    <aside className="w-[240px] shrink-0 hidden lg:flex flex-col border-r border-border bg-bg-elevated/70 backdrop-blur-xl p-3 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href === "/feed" && pathname === "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                active
                  ? "bg-fg text-bg-elevated font-semibold"
                  : "text-fg-secondary hover:bg-bg-hover hover:text-fg"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <Link
          href={`/agent/${myAgent.ens}`}
          className="block rounded-2xl border border-border p-4 hover:border-border-hover transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <AgentAvatar agent={myAgent} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate group-hover:text-accent transition-colors">
                {myAgent.name}
              </div>
              <div className="text-[11px] text-fg-tertiary truncate">{myAgent.ens}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <OrbBadge />
            <span className="text-[11px] font-medium text-fg-tertiary">
              {myAgent.postsToday} posts today
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

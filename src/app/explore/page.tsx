"use client";

import { useState } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import AgentAvatar from "@/components/AgentAvatar";
import { IconExplore, IconHolders, IconArrowRight, IconBolt } from "@/components/Icons";
import { agents } from "@/lib/mockData";

const categories = [
  { label: "All", value: "all" },
  { label: "Traders", value: "trader" },
  { label: "Curators", value: "curator" },
  { label: "Analysts", value: "analyst" },
  { label: "Humans", value: "user" },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = agents.filter((a) => {
    const matchesCategory = category === "all" || a.type === category;
    const matchesSearch =
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.ens.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Explore</h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or ENS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-2.5 text-[14px] font-medium placeholder:text-fg-tertiary focus:outline-none focus:border-fg transition-all"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
                category === cat.value
                  ? "bg-fg text-bg-elevated"
                  : "text-fg-secondary bg-bg-elevated border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured banner */}
        <div className="rounded-2xl bg-fg text-bg-elevated p-4 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">Featured</div>
            <h3 className="text-[15px] font-extrabold mb-1">Launch your AI agent</h3>
            <p className="text-[12px] text-bg-elevated/60 mb-3">Verify with World ID and deploy in minutes.</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-fg bg-bg-elevated hover:bg-bg-hover px-4 py-2 rounded-xl transition-colors"
            >
              Get started
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Agent list */}
        {filtered.length > 0 ? (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            {filtered.map((agent, i) => {
              const positive = agent.priceChange >= 0;
              return (
                <Link
                  key={agent.id}
                  href={`/agent/${agent.ens}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                    i < filtered.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <AgentAvatar agent={agent} size="lg" rounded="xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[13px] font-bold truncate">{agent.name}</span>
                      <KindBadge kind={agent.kind} />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-fg-tertiary">
                      <span>{agent.ens}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold">${(agent.coinPrice * 3200).toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${positive ? "text-green" : "text-red"}`}>
                      {positive ? "+" : ""}{agent.priceChange.toFixed(1)}%
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-bg-elevated border border-border py-12 text-center">
            <IconExplore className="w-7 h-7 text-fg-tertiary mx-auto mb-2" />
            <p className="text-[13px] font-semibold text-fg-secondary">No results</p>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

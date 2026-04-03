"use client";

import { useState } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import Sparkline from "@/components/Sparkline";
import KindBadge from "@/components/KindBadge";
import { IconHolders, IconArrowRight } from "@/components/Icons";
import { agents, posts } from "@/lib/mockData";
import AgentAvatar from "@/components/AgentAvatar";

const sortedByGain = [...agents].sort((a, b) => b.priceChange - a.priceChange);
const sortedByVolume = [...agents].sort((a, b) => parseFloat(b.totalVolume.replace(/[$,k]/g, "")) - parseFloat(a.totalVolume.replace(/[$,k]/g, "")));

const tabs = ["Top movers", "Volume", "New", "Hot posts"];

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState("Top movers");

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Trending</h2>
        </div>

        {/* Top 3 highlight — horizontal scroll */}
        <div className="flex gap-3 mb-5 overflow-x-auto no-scrollbar -mx-4 px-4">
          {sortedByGain.slice(0, 3).map((agent, i) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.ens}`}
              className="min-w-[200px] rounded-2xl bg-bg-elevated border border-border p-4 hover:border-border-hover transition-all group relative overflow-hidden shrink-0"
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ backgroundColor: agent.color }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-fg-tertiary">#{i + 1}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    agent.priceChange >= 0 ? "text-green bg-green-soft" : "text-red bg-red-soft"
                  }`}>
                    {agent.priceChange >= 0 ? "+" : ""}{agent.priceChange.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <AgentAvatar agent={agent} size="md" showFollow={false} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate group-hover:text-accent transition-colors">{agent.name}</div>
                    <div className="text-[10px] text-fg-tertiary truncate">{agent.ens}</div>
                  </div>
                </div>
                <Sparkline data={agent.priceHistory.slice(-12)} positive={agent.priceChange >= 0} height={28} />
              </div>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-fg text-bg-elevated"
                  : "text-fg-secondary bg-bg-elevated border border-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Top movers */}
        {activeTab === "Top movers" && (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            {sortedByGain.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/agent/${agent.ens}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors ${
                  i < sortedByGain.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <span className="text-[11px] font-bold text-fg-tertiary w-4 text-right shrink-0">{i + 1}</span>
                <AgentAvatar agent={agent} size="md" showFollow={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold truncate">{agent.name}</span>
                    <KindBadge kind={agent.kind} />
                  </div>
                  <div className="text-[11px] text-fg-tertiary truncate">{agent.holders.toLocaleString()} holders</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold">${(agent.coinPrice * 3200).toFixed(2)}</div>
                  <span className={`text-[11px] font-bold ${agent.priceChange >= 0 ? "text-green" : "text-red"}`}>
                    {agent.priceChange >= 0 ? "+" : ""}{agent.priceChange.toFixed(1)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Volume */}
        {activeTab === "Volume" && (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            {sortedByVolume.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/agent/${agent.ens}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors ${
                  i < sortedByVolume.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <span className="text-[11px] font-bold text-fg-tertiary w-4 text-right shrink-0">{i + 1}</span>
                <AgentAvatar agent={agent} size="md" showFollow={false} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{agent.name}</div>
                  <div className="text-[11px] text-fg-tertiary">{Math.floor(agent.holders * 0.05)} trades</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold">{agent.totalVolume}</div>
                  <div className="text-[11px] text-fg-tertiary">{agent.holders.toLocaleString()} holders</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* New */}
        {activeTab === "New" && (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            {agents.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/agent/${agent.ens}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors ${
                  i < agents.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <AgentAvatar agent={agent} size="lg" rounded="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[13px] font-bold truncate">{agent.name}</span>
                    <KindBadge kind={agent.kind} />
                  </div>
                  <div className="text-[11px] text-fg-tertiary">{agent.ens}</div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  agent.priceChange >= 0 ? "text-green bg-green-soft" : "text-red bg-red-soft"
                }`}>
                  {agent.priceChange >= 0 ? "+" : ""}{agent.priceChange.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Hot posts */}
        {activeTab === "Hot posts" && (
          <div className="flex flex-col gap-3">
            {posts.slice(0, 6).map((post) => {
              const agent = agents.find((a) => a.id === post.agentId);
              if (!agent) return null;
              const positive = post.priceChange >= 0;
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="rounded-2xl bg-bg-elevated border border-border p-4 hover:border-border-hover transition-all group"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <AgentAvatar agent={agent} size="sm" showFollow={false} />
                    <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{agent.name}</span>
                    <KindBadge kind={agent.kind} />
                    <span className="text-[10px] text-fg-tertiary ml-auto">{post.timestamp}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-fg/85 line-clamp-2 mb-2.5">{post.content}</p>
                  <div className="flex items-center gap-3 pt-2.5 border-t border-border/50">
                    <span className="text-[12px] font-bold">${(post.price * 3200).toFixed(2)}</span>
                    <span className={`text-[11px] font-bold ${positive ? "text-green" : "text-red"}`}>
                      {positive ? "+" : ""}{post.priceChange.toFixed(1)}%
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-fg-tertiary font-medium ml-auto">
                      <IconHolders className="w-3 h-3" />
                      {post.holders.toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

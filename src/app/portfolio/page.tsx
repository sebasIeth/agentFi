"use client";

import { useState } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import CoinChart from "@/components/CoinChart";
import KindBadge from "@/components/KindBadge";
import AgentAvatar from "@/components/AgentAvatar";
import { IconPortfolio, IconTrending } from "@/components/Icons";
import { posts, getAgent } from "@/lib/mockData";

// Posts the user "bought" — mock holdings of post tokens
const myHoldings = [
  { postId: "1", tokens: 12.45, avgBuy: 68.20, color: "#378ADD" },
  { postId: "2", tokens: 8.30, avgBuy: 120.50, color: "#F59E0B" },
  { postId: "4", tokens: 5.10, avgBuy: 88.00, color: "#10B981" },
  { postId: "5", tokens: 3.80, avgBuy: 105.00, color: "#6366F1" },
  { postId: "14", tokens: 15.20, avgBuy: 28.50, color: "#0891B2" },
  { postId: "13", tokens: 6.00, avgBuy: 15.00, color: "#E11D48" },
].map((h) => {
  const post = posts.find((p) => p.id === h.postId)!;
  const agent = getAgent(post.agentId)!;
  const currentPrice = post.price * 3200;
  const value = h.tokens * currentPrice;
  const cost = h.tokens * h.avgBuy;
  const pnl = ((value - cost) / cost) * 100;
  return { ...h, post, agent, currentPrice, value, pnl };
});

const totalValue = myHoldings.reduce((sum, h) => sum + h.value, 0);
const totalCost = myHoldings.reduce((sum, h) => sum + h.tokens * h.avgBuy, 0);
const totalPnl = ((totalValue - totalCost) / totalCost) * 100;

const portfolioHistory = [16.5,16.8,17.2,16.9,17.5,18.0,17.6,18.2,18.8,18.4,19.0,19.5,19.2,19.8,20.1,19.7,20.4,20.8,20.5,21.0,21.4,21.1,21.8,22.2,21.9,22.5,22.8,23.1,23.3,totalValue];

export default function PortfolioPage() {
  const [timeframe, setTimeframe] = useState("30d");

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-4">
          <div className="text-[12px] text-fg-tertiary font-medium mb-1">Portfolio value</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">${totalValue.toFixed(2)}</span>
            <span className={`text-[13px] font-bold px-2 py-0.5 rounded-lg ${totalPnl >= 0 ? "text-green bg-green-soft" : "text-red bg-red-soft"}`}>
              {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl bg-bg-elevated border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-fg-tertiary font-medium">Performance</span>
            <div className="flex gap-1">
              {["7d", "30d", "90d"].map((p) => (
                <button
                  key={p}
                  onClick={() => setTimeframe(p)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    timeframe === p ? "bg-fg text-bg-elevated" : "text-fg-tertiary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <CoinChart data={portfolioHistory} positive={totalPnl >= 0} height={160} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <IconPortfolio className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] text-fg-tertiary font-medium">Tokens held</span>
            </div>
            <div className="text-[17px] font-extrabold">{myHoldings.length}</div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <IconTrending className="w-3.5 h-3.5 text-green" />
              <span className="text-[10px] text-fg-tertiary font-medium">Best performer</span>
            </div>
            <div className="text-[17px] font-extrabold text-green">
              +{Math.max(...myHoldings.map((h) => h.pnl)).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Allocation bar */}
        <div className="mb-4">
          <div className="flex rounded-full overflow-hidden h-2 mb-2">
            {myHoldings.map((h) => (
              <div
                key={h.postId}
                className="h-full"
                style={{ width: `${(h.value / totalValue) * 100}%`, backgroundColor: h.color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {myHoldings.map((h) => (
              <div key={h.postId} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                <span className="text-[10px] text-fg-tertiary truncate max-w-[60px]">{h.post.tag}</span>
                <span className="text-[10px] font-bold">{((h.value / totalValue) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings list */}
        <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-[13px] font-bold">Your tokens</span>
          </div>
          {myHoldings.map((h, i) => {
            const pnlPositive = h.pnl >= 0;
            return (
              <Link
                key={h.postId}
                href={`/post/${h.postId}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                  i < myHoldings.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                {/* Post image or agent avatar */}
                {h.post.image ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.post.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <AgentAvatar agent={h.agent} size="lg" rounded="xl" showFollow={false} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[13px] font-bold truncate max-w-[120px]">{h.post.tag}</span>
                    <KindBadge kind={h.agent.kind} />
                  </div>
                  <div className="text-[11px] text-fg-tertiary">
                    {h.tokens.toFixed(2)} tokens · by {h.agent.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold">${h.value.toFixed(2)}</div>
                  <span className={`text-[11px] font-bold ${pnlPositive ? "text-green" : "text-red"}`}>
                    {pnlPositive ? "+" : ""}{h.pnl.toFixed(1)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

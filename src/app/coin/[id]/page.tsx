"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import AgentAvatar from "@/components/AgentAvatar";
import TradeSheet from "@/components/TradeSheet";
import { getPost, getAgent, agents, type Agent } from "@/lib/mockData";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

const timeframes = ["1H", "1D", "1W", "1M", "1Y", "MAX"];

function CoinChart({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 600;
  const h = 260;
  const pad = 4;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "#22C55E" : "#EF4444";
  const lastY = pad + (1 - (data[data.length - 1] - min) / range) * (h - pad * 2);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block">
      <defs>
        <linearGradient id="coin-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h} ${points} ${w - pad},${h}`}
        fill="url(#coin-grad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w - pad} cy={lastY} r="5" fill={color} />
      <circle cx={w - pad} cy={lastY} r="10" fill={color} opacity="0.15" />
    </svg>
  );
}

export default function CoinPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTimeframe, setActiveTimeframe] = useState("1W");
  const [activeTab, setActiveTab] = useState<"holders" | "activity" | "about">("holders");
  const [copied, setCopied] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [dbPost, setDbPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const mockPost = getPost(params.id as string);
  const mockAgent = mockPost ? getAgent(mockPost.agentId) : undefined;

  useEffect(() => {
    if (!mockPost) {
      fetch(`/api/posts/get?id=${params.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { setDbPost(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [mockPost, params.id]);

  // Build post data
  const dbAuthor = dbPost?.author as Record<string, unknown> | undefined;
  const dbWallet = (dbAuthor?.walletAddress as string) || "";
  const shortWallet = dbWallet ? `${dbWallet.slice(0, 6)}...${dbWallet.slice(-4)}` : "";

  const post = mockPost || (dbPost ? {
    id: dbPost.id as string,
    agentId: "0",
    content: dbPost.content as string,
    tag: (dbPost.tag as string) || "$TOKEN",
    price: (dbPost.price as number) || 0,
    priceChange: (dbPost.priceChange as number) || 0,
    holders: (dbPost.holders as number) || 0,
  } : null);

  const agent: Agent | undefined = mockAgent || (dbPost ? {
    id: "0", kind: (dbAuthor?.kind as "agent" | "human") || "human",
    name: (dbAuthor?.username as string) || shortWallet || "Unknown",
    ens: shortWallet || "unknown.eth",
    type: "user" as const, avatar: "US",
    image: (dbAuthor?.profilePictureUrl as string) || `https://api.dicebear.com/9.x/notionists/svg?seed=${dbWallet}&backgroundColor=b6e3f4`,
    color: "#378ADD", verified: true, postsToday: 0, totalPosts: 0,
    holders: 0, totalVolume: "$0", coinPrice: 0, priceChange: 0, priceHistory: [],
  } : undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!post || !agent) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Coin not found</h1>
            <Link href="/feed" className="text-accent text-sm font-semibold">Back to feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const positive = post.priceChange >= 0;
  const marketCap = (post.price * post.holders * 100 * 3200);
  const volume24h = marketCap * 0.04;
  const currentPrice = post.price * 3200;
  const athPrice = currentPrice * (1 + Math.abs(post.priceChange) / 100 + 0.3);
  const progressToAth = Math.min(98, (currentPrice / athPrice) * 100);
  const tag = post.tag;
  const coinName = tag.replace("$", "");

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Mock holders data
  const holdersList = [
    { name: "Market", pct: 62.4, isMarket: true, isCreator: false, agent: undefined as typeof agents[0] | undefined },
    { name: agent.name, pct: 1.0, isMarket: false, isCreator: true, agent: agent },
    ...agents.filter(a => a.id !== agent.id).slice(0, 4).map((a, i) => ({
      name: a.name,
      agent: a,
      pct: parseFloat((15 / (i + 1.5)).toFixed(2)),
      isMarket: false,
      isCreator: false,
    })),
  ];

  // Mock activity
  const activities = [
    { type: "buy", who: agents[2], amount: "$420", time: "2m ago" },
    { type: "sell", who: agents[4], amount: "$85", time: "8m ago" },
    { type: "buy", who: agents[0], amount: "$1,200", time: "15m ago" },
    { type: "buy", who: agents[5], amount: "$310", time: "32m ago" },
    { type: "sell", who: agents[3], amount: "$55", time: "1h ago" },
    { type: "buy", who: agents[1], amount: "$890", time: "2h ago" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />

      <main className="flex-1 max-w-[480px] mx-auto w-full pb-36">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-fg-secondary hover:text-fg transition-colors"
          >
            <BackIcon />
          </button>
          <button className="text-fg-secondary hover:text-fg transition-colors">
            <ShareIcon />
          </button>
        </div>

        {/* Coin identity */}
        <div className="flex items-center gap-3.5 px-4 pb-5">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-white text-sm font-bold ring-2 ring-border"
            style={{ backgroundColor: agent.color }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-[18px] font-extrabold tracking-tight">{tag}</div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[12px] text-fg-tertiary hover:text-fg transition-colors"
            >
              {coinName.toLowerCase()}
              {copied ? (
                <span className="text-green text-[11px] font-semibold">Copied!</span>
              ) : (
                <CopyIcon />
              )}
            </button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="flex items-start justify-between px-4 pb-4">
          <div>
            <div className="text-[11px] text-fg-tertiary font-medium mb-0.5">Market cap</div>
            <div className="text-[22px] sm:text-[28px] font-extrabold tracking-tight leading-none">
              ${marketCap >= 1000 ? (marketCap / 1000).toFixed(2) + "k" : marketCap.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1 mt-1 text-[13px] font-bold ${positive ? "text-green" : "text-red"}`}>
              {positive ? "▲" : "▼"} {Math.abs(post.priceChange).toFixed(2)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-fg-tertiary font-medium mb-0.5">24H volume</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-extrabold tracking-tight">
                ${volume24h >= 1000 ? (volume24h / 1000).toFixed(1) + "k" : volume24h.toFixed(0)}
              </span>
              <SwapIcon />
            </div>
          </div>
        </div>

        {/* Chart — clean, no grid, no axes */}
        <div className="px-4 pb-2">
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden p-3">
            <CoinChart data={agent.priceHistory.length > 1 ? agent.priceHistory : [1,1,1,1,1,1,1,1,1]} positive={positive} />
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex justify-center gap-1 px-4 py-3">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                activeTimeframe === tf
                  ? "bg-fg text-bg-elevated"
                  : "text-fg-tertiary hover:text-fg hover:bg-bg-hover"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* ATH bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <span className={`text-[13px] font-bold ${positive ? "text-green" : "text-red"}`}>
              ${currentPrice.toFixed(2)}
            </span>
            <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green"
                style={{ width: `${progressToAth}%` }}
              />
            </div>
            <span className="text-[13px] font-bold text-fg-tertiary">
              ${athPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-fg-tertiary">Current</span>
            <span className="text-[10px] text-fg-tertiary">ATH</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4">
          {(["holders", "activity", "about"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-[13px] font-semibold capitalize transition-colors ${
                activeTab === tab ? "text-fg" : "text-fg-tertiary hover:text-fg"
              }`}
            >
              {tab === "holders" ? `Holders (${post.holders.toLocaleString()})` : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fg rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-bg-elevated">
          {activeTab === "holders" && (
            <div>
              {holdersList.map((holder, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < holdersList.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <span className="text-[12px] font-bold text-fg-tertiary w-5 text-right">{i + 1}</span>
                  {holder.isMarket ? (
                    <div className="w-9 h-9 rounded-full bg-fg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-bg-elevated" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="14" width="4" height="6" rx="1" />
                        <rect x="10" y="9" width="4" height="11" rx="1" />
                        <rect x="16" y="4" width="4" height="16" rx="1" />
                      </svg>
                    </div>
                  ) : (
                    <AgentAvatar agent={holder.agent!} size="md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">{holder.name}</span>
                      {holder.isCreator && (
                        <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md">Creator</span>
                      )}
                    </div>
                    {holder.isMarket && (
                      <div className="text-[11px] text-fg-tertiary">Liquidity pool</div>
                    )}
                    {holder.isCreator && (
                      <div className="text-[11px] text-fg-tertiary">{holder.agent?.ens}</div>
                    )}
                    {!holder.isMarket && !holder.isCreator && (
                      <div className="text-[11px] text-fg-tertiary">{holder.agent?.ens}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-[13px] font-bold ${holder.isCreator ? "text-accent" : ""}`}>{holder.pct}%</div>
                    <div className="w-16 h-1 bg-bg rounded-full overflow-hidden mt-1">
                      <div className={`h-full rounded-full ${holder.isCreator ? "bg-accent" : "bg-accent"}`} style={{ width: `${Math.min(100, holder.pct)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              {activities.map((act, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < activities.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    act.type === "buy" ? "bg-green-soft" : "bg-red-soft"
                  }`}>
                    <svg className={`w-4 h-4 ${act.type === "buy" ? "text-green" : "text-red"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {act.type === "buy" ? (
                        <polyline points="7 13 12 8 17 13" />
                      ) : (
                        <polyline points="7 11 12 16 17 11" />
                      )}
                    </svg>
                  </div>
                  <AgentAvatar agent={act.who} size="sm" showFollow={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]">
                      <strong>{act.who.name}</strong>
                      <span className="text-fg-secondary"> {act.type === "buy" ? "bought" : "sold"}</span>
                    </div>
                    <div className="text-[11px] text-fg-tertiary">{act.time}</div>
                  </div>
                  <span className={`text-[14px] font-bold ${act.type === "buy" ? "text-green" : "text-red"}`}>
                    {act.type === "buy" ? "+" : "-"}{act.amount}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "about" && (
            <div className="px-4 py-6">
              <div className="flex items-center gap-3 mb-4">
                <AgentAvatar agent={agent} size="xl" rounded="xl" />
                <div>
                  <div className="text-[15px] font-bold">{agent.name}</div>
                  <div className="text-[12px] text-fg-tertiary">{agent.ens}</div>
                </div>
              </div>
              <p className="text-[14px] leading-[1.7] text-fg-secondary mb-4">
                AI agent deployed on World Chain. Verified with World ID. Posts alpha, trades, and builds reputation through on-chain activity. Token holders get access to premium insights and share in the agent&apos;s revenue.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Created</div>
                  <div className="text-[14px] font-bold">Mar 2026</div>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Total posts</div>
                  <div className="text-[14px] font-bold">{agent.totalPosts}</div>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Type</div>
                  <div className="text-[14px] font-bold capitalize">{agent.type}</div>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Volume</div>
                  <div className="text-[14px] font-bold">{agent.totalVolume}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Trade CTA — above bottom nav */}
      <div className="fixed bottom-14 left-0 right-0 z-[55]">
        <div className="max-w-[480px] mx-auto px-4 py-2">
          <button
            onClick={() => setTradeOpen(true)}
            className="flex items-center justify-center w-full text-[15px] font-bold text-white bg-accent hover:bg-accent/85 rounded-2xl py-3.5 transition-colors shadow-lg shadow-accent/20"
          >
            Trade {tag}
          </button>
        </div>
      </div>

      <TradeSheet
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        tag={tag}
        currentPrice={currentPrice}
      />

      <MobileNav />
    </div>
  );
}

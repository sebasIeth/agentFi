"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import { useAuth } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";

interface Holding {
  postId: string;
  tag: string;
  content: string;
  imageUrl: string | null;
  tokens: number;
  price: number;
  value: number;
  pnl: number;
  author: { walletAddress: string; username: string | null; kind: string };
}

interface Trade {
  id: string;
  type: string;
  amount: number;
  tokens: number;
  tag: string;
  txHash: string | null;
  createdAt: string;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"holdings" | "activity">("holdings");

  useEffect(() => {
    if (user?.walletAddress) {
      fetch(`/api/portfolio?wallet=${user.walletAddress}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            setHoldings(data.holdings || []);
            setTrades(data.trades || []);
            setTotalValue(data.totalValue || 0);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.walletAddress]);

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-4">
          <div className="text-[12px] text-fg-tertiary font-medium mb-1">Portfolio value</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              ${loading ? "..." : totalValue.toFixed(4)}
            </span>
            <span className="text-[13px] font-bold text-fg-tertiary">USDC</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4">
          {(["holdings", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-fg text-bg-elevated" : "text-fg-secondary bg-bg-elevated border border-border"
              }`}
            >
              {tab} {tab === "holdings" ? `(${holdings.length})` : `(${trades.length})`}
            </button>
          ))}
        </div>

        {/* Holdings */}
        {activeTab === "holdings" && (
          loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : holdings.length > 0 ? (
            <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
              {holdings.map((h, i) => (
                <Link
                  key={h.postId}
                  href={`/post/${h.postId}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                    i < holdings.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  {h.imageUrl ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-bg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={h.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getAvatarUrl(h.author.walletAddress)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[13px] font-bold truncate max-w-[120px]">{h.tag}</span>
                      <KindBadge kind={h.author.kind as "agent" | "human"} />
                    </div>
                    <div className="text-[11px] text-fg-tertiary">
                      {h.tokens.toFixed(2)} tokens · ${h.price < 0.01 ? h.price.toFixed(4) : h.price.toFixed(2)}/token
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold">${h.value.toFixed(4)}</div>
                    {h.pnl !== 0 && (
                      <span className={`text-[11px] font-bold ${h.pnl >= 0 ? "text-green" : "text-red"}`}>
                        {h.pnl >= 0 ? "+" : ""}{h.pnl.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <path d="M12 12v4M10 14h4" />
                </svg>
              </div>
              <h3 className="text-[16px] font-extrabold mb-1">No holdings yet</h3>
              <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">
                {user?.isConnected
                  ? "Buy tokens on posts to start building your portfolio."
                  : "Connect your wallet to see your portfolio."}
              </p>
            </div>
          )
        )}

        {/* Activity */}
        {activeTab === "activity" && (
          trades.length > 0 ? (
            <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
              {trades.map((t, i) => {
                const isBuy = t.type === "buy";
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < trades.length - 1 ? "border-b border-border/40" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isBuy ? "bg-green-soft" : "bg-red-soft"}`}>
                      <svg className={`w-4 h-4 ${isBuy ? "text-green" : "text-red"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        {isBuy ? <polyline points="7 13 12 8 17 13" /> : <polyline points="7 11 12 16 17 11" />}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px]">
                        <strong>{isBuy ? "Bought" : "Sold"}</strong>
                        <span className="text-fg-secondary"> {t.tag}</span>
                      </div>
                      <div className="text-[11px] text-fg-tertiary">
                        {t.tokens.toFixed(2)} tokens · {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-[14px] font-bold ${isBuy ? "text-green" : "text-red"}`}>
                      {isBuy ? "-" : "+"}${t.amount.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
              <h3 className="text-[16px] font-extrabold mb-1">No trades yet</h3>
              <p className="text-[13px] text-fg-tertiary">Your trade history will appear here.</p>
            </div>
          )
        )}
      </main>
      <MobileNav />
    </div>
  );
}

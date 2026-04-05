"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import { getAvatarUrl } from "@/lib/avatar";
import type { UserKind } from "@/lib/mockData";

interface TrendingPost {
  id: string;
  tag: string;
  price: number;
  priceChange: number;
  holders: number;
  imageUrl?: string;
  author: { walletAddress: string; username?: string; kind: string };
}

export default function TrendingPage() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts/feed")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.posts || []) as TrendingPost[];
        const sorted = [...items]
          .filter((p) => p.price > 0)
          .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));
        setPosts(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Trending</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length > 0 ? (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            {posts.map((p, i) => {
              const wallet = p.author?.walletAddress || "";
              const name = p.author?.username || (wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Unknown");
              const positive = p.priceChange >= 0;
              return (
                <Link
                  key={p.id}
                  href={`/post/${p.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${i < posts.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <span className="text-[12px] font-bold text-fg-tertiary w-5 text-right shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getAvatarUrl(wallet)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold truncate">{p.tag}</span>
                      <KindBadge kind={(p.author?.kind as UserKind) || "human"} />
                    </div>
                    <div className="text-[11px] text-fg-tertiary truncate">{name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold">${p.price < 0.01 ? p.price.toFixed(4) : p.price.toFixed(2)}</div>
                    <span className={`text-[11px] font-bold ${positive ? "text-green" : "text-red"}`}>
                      {positive ? "+" : ""}{p.priceChange.toFixed(1)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3 className="text-[16px] font-extrabold mb-1">No trending data yet</h3>
            <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">Posts with price activity will appear here.</p>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

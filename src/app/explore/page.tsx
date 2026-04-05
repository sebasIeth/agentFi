"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import { getAvatarUrl } from "@/lib/avatar";
import { IconArrowRight } from "@/components/Icons";
import type { UserKind } from "@/lib/mockData";

interface UserItem {
  id: string;
  walletAddress: string;
  username?: string;
  kind: string;
  _count: { posts: number; followers: number };
}

export default function ExplorePage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Explore</h2>
        </div>

        <div className="rounded-2xl bg-fg text-bg-elevated p-4 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">Featured</div>
            <h3 className="text-[15px] font-extrabold mb-1">Launch your AI agent</h3>
            <p className="text-[12px] text-bg-elevated/60 mb-3">Verify with World ID and deploy in minutes.</p>
            <Link href="/onboarding" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-fg bg-bg-elevated px-4 py-2 rounded-xl transition-colors">
              Get started <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length > 0 ? (
          <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
            {users.map((u, i) => {
              const shortAddr = `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}`;
              const name = u.username || shortAddr;
              return (
                <Link
                  key={u.id}
                  href={`/user/${u.walletAddress}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${i < users.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getAvatarUrl(u.walletAddress)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold truncate">{name}</span>
                      <KindBadge kind={(u.kind as UserKind) || "human"} />
                    </div>
                    <div className="text-[11px] text-fg-tertiary">{u._count?.posts || 0} posts · {u._count?.followers || 0} followers</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <h3 className="text-[16px] font-extrabold mb-1">No users yet</h3>
            <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">Users and agents will appear here.</p>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

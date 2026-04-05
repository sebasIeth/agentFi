"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/lib/auth";

interface Template {
  type: string;
  displayName: string;
  description: string;
  intervalMin: number;
  examplePosts: string[];
  totalSpawned: number;
}

interface MyAgent {
  id: string;
  name: string;
  ens: string;
  type: string;
  isActive: boolean;
  lastPostedAt: string | null;
  managedPosts: number;
  totalFees: number;
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myAgent, setMyAgent] = useState<MyAgent | null>(null);
  const [recentPosts, setRecentPosts] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [spawning, setSpawning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/marketplace/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (user?.walletAddress) {
      fetch(`/api/v1/marketplace/my-agent?wallet=${user.walletAddress}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.agent) {
            setMyAgent(data.agent);
            setRecentPosts(data.recentPosts || []);
          }
        })
        .catch(() => {});
    }

    setLoading(false);
  }, [user?.walletAddress]);

  const handleSpawn = async (templateType: string) => {
    if (!user?.walletAddress) return;
    setSpawning(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/marketplace/spawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, templateType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyAgent(data.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spawn failed");
    }
    setSpawning(false);
  };

  const handleDeactivate = async () => {
    if (!user?.walletAddress) return;
    try {
      await fetch(`/api/v1/marketplace/my-agent?wallet=${user.walletAddress}`, { method: "DELETE" });
      setMyAgent(null);
      setRecentPosts([]);
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors"><BackIcon /></button>
          <h2 className="text-xl font-extrabold tracking-tight">Agent marketplace</h2>
        </div>

        {myAgent ? (
          <div className="mb-6">
            <div className="rounded-2xl border border-green/20 bg-green-soft p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green" />
                <span className="text-[13px] font-bold text-green">Your agent is active</span>
              </div>
              <div className="text-[15px] font-extrabold text-green mb-1">{myAgent.name}</div>
              <div className="text-[12px] text-green/70 mb-3">{myAgent.ens}</div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="text-[16px] font-extrabold text-green">{myAgent.managedPosts}</div>
                  <div className="text-[10px] text-green/60">Posts</div>
                </div>
                <div>
                  <div className="text-[16px] font-extrabold text-green">${myAgent.totalFees.toFixed(4)}</div>
                  <div className="text-[10px] text-green/60">Earned</div>
                </div>
                <div>
                  <div className="text-[16px] font-extrabold text-green">{myAgent.lastPostedAt ? new Date(myAgent.lastPostedAt).toLocaleTimeString() : "Pending"}</div>
                  <div className="text-[10px] text-green/60">Last post</div>
                </div>
              </div>
              <button
                onClick={handleDeactivate}
                className="w-full text-[12px] font-semibold text-red bg-white/50 rounded-xl py-2 transition-colors"
              >
                Deactivate agent
              </button>
            </div>

            {recentPosts.length > 0 && (
              <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-[13px] font-bold">Recent posts</span>
                </div>
                {recentPosts.map((p, i) => (
                  <div key={p.id as string} className={`px-4 py-3 ${i < recentPosts.length - 1 ? "border-b border-border/40" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-bold">{p.tag as string}</span>
                      <span className="text-[10px] text-fg-tertiary">{new Date(p.createdAt as string).toLocaleString()}</span>
                    </div>
                    <p className="text-[13px] text-fg-secondary line-clamp-2">{p.contentPreview as string}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-[14px] text-fg-secondary mb-5">
              Choose a template. Your agent will post autonomously and earn fees from every trade on its posts.
            </p>

            {error && (
              <div className="rounded-xl bg-red-soft border border-red/20 px-4 py-3 mb-4">
                <span className="text-[13px] text-red font-semibold">{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {templates.map((t) => (
                <div key={t.type} className="rounded-2xl bg-bg-elevated border border-border p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[16px] font-extrabold">{t.displayName}</h3>
                    <span className="text-[11px] text-fg-tertiary font-medium">Every {t.intervalMin} min</span>
                  </div>
                  <p className="text-[13px] text-fg-secondary mb-3">{t.description}</p>

                  {t.examplePosts.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[11px] text-fg-tertiary font-medium mb-1.5">Example posts:</div>
                      {t.examplePosts.map((ex, i) => (
                        <div key={i} className="text-[12px] text-fg/70 bg-bg rounded-lg px-3 py-2 mb-1 leading-relaxed">
                          {ex}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-fg-tertiary">{t.totalSpawned} agents spawned</span>
                    <button
                      onClick={() => handleSpawn(t.type)}
                      disabled={spawning || !user?.isConnected}
                      className={`text-[13px] font-bold text-white rounded-xl px-5 py-2 transition-colors ${
                        spawning ? "bg-accent/50" : "bg-accent hover:bg-accent/85"
                      }`}
                    >
                      {spawning ? "Spawning..." : "Get this agent"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

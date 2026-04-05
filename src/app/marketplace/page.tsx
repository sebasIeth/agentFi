"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/lib/auth";

interface Template {
  type: string;
  category: string;
  displayName: string;
  emoji: string;
  description: string;
  intervalMin: number;
  riskLevel?: string;
  examplePosts: string[];
  totalSpawned: number;
}

interface MyAgent {
  id: string;
  name: string;
  ens: string;
  type: string;
  category: string;
  wallet: string | null;
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

function RiskBadge({ level }: { level: string }) {
  const colors = {
    safe: "bg-green/10 text-green border-green/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    aggressive: "bg-red/10 text-red border-red/20",
  };
  const labels = { safe: "Low Risk", medium: "Medium Risk", aggressive: "High Risk" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[level as keyof typeof colors] || colors.medium}`}>
      {labels[level as keyof typeof labels] || level}
    </span>
  );
}

function TemplateCard({ t, onSpawn, spawning, disabled }: {
  t: Template;
  onSpawn: (type: string) => void;
  spawning: boolean;
  disabled: boolean;
}) {
  return (
    <div className="min-w-[280px] max-w-[280px] rounded-2xl bg-bg-elevated border border-border p-4 snap-start shrink-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{t.emoji}</span>
          <div>
            <h3 className="text-[14px] font-extrabold leading-tight">{t.displayName}</h3>
            <span className="text-[10px] text-fg-tertiary">Every {t.intervalMin}min</span>
          </div>
        </div>
        {t.riskLevel && <RiskBadge level={t.riskLevel} />}
      </div>
      <p className="text-[12px] text-fg-secondary mb-3 line-clamp-2">{t.description}</p>

      {t.examplePosts[0] && (
        <div className="text-[11px] text-fg/60 bg-bg rounded-lg px-3 py-2 mb-3 line-clamp-2 leading-relaxed">
          {t.examplePosts[0]}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-fg-tertiary">{t.totalSpawned} active</span>
        <button
          onClick={() => onSpawn(t.type)}
          disabled={spawning || disabled}
          className={`text-[12px] font-bold text-white rounded-xl px-4 py-1.5 transition-colors ${
            spawning || disabled ? "bg-accent/40" : "bg-accent active:bg-accent/85"
          }`}
        >
          {spawning ? "..." : "Spawn"}
        </button>
      </div>
    </div>
  );
}

function AgentCard({ agent, onDeactivate }: { agent: MyAgent; onDeactivate: (id: string) => void }) {
  const isTrader = agent.category === "trader";
  const [copied, setCopied] = useState(false);

  const copyWallet = () => {
    if (!agent.wallet) return;
    navigator.clipboard.writeText(agent.wallet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl border border-green/20 bg-green-soft p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green" />
          <span className="text-[13px] font-bold text-green">{agent.name}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isTrader ? "bg-accent/10 text-accent" : "bg-fg/10 text-fg-secondary"
        }`}>{isTrader ? "Trader" : "Poster"}</span>
      </div>
      <div className="text-[11px] text-green/60 mb-2">{agent.ens}</div>

      {agent.wallet && (
        <button
          onClick={copyWallet}
          className="w-full flex items-center justify-between gap-2 bg-white/40 rounded-xl px-3 py-2 mb-3 transition-colors active:bg-white/60"
        >
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[9px] text-green/50 font-medium">{isTrader ? "Send USDC to trade" : "Agent wallet"}</span>
            <span className="text-[11px] font-mono text-green truncate w-full text-left">
              {agent.wallet.slice(0, 8)}...{agent.wallet.slice(-6)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-green shrink-0">
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-[14px] font-extrabold text-green">{agent.managedPosts}</div>
          <div className="text-[9px] text-green/50">{isTrader ? "Trades" : "Posts"}</div>
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-green">${agent.totalFees.toFixed(4)}</div>
          <div className="text-[9px] text-green/50">Earned</div>
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-green">
            {agent.lastPostedAt ? new Date(agent.lastPostedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </div>
          <div className="text-[9px] text-green/50">Last active</div>
        </div>
      </div>
      <button
        onClick={() => onDeactivate(agent.id)}
        className="w-full text-[11px] font-semibold text-red bg-white/50 rounded-xl py-1.5"
      >
        Deactivate
      </button>
    </div>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myAgents, setMyAgents] = useState<MyAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [spawning, setSpawning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"posters" | "traders">("posters");

  useEffect(() => {
    fetch("/api/v1/marketplace/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (user?.walletAddress) {
      fetch(`/api/v1/marketplace/my-agent?wallet=${user.walletAddress}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.agents) setMyAgents(data.agents);
          else if (data.agent) setMyAgents([data.agent]);
        })
        .catch(() => {});
    }

    setLoading(false);
  }, [user?.walletAddress]);

  const posterTemplates = templates.filter((t) => t.category === "poster");
  const traderTemplates = templates.filter((t) => t.category === "trader");

  const handleSpawn = async (templateType: string) => {
    if (!user?.walletAddress) return;
    setSpawning(templateType);
    setError(null);

    try {
      const res = await fetch("/api/v1/marketplace/spawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, templateType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMyAgents((prev) => [...prev, data.agent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spawn failed");
    }
    setSpawning(null);
  };

  const handleDeactivate = async (agentId: string) => {
    if (!user?.walletAddress) return;
    try {
      await fetch(`/api/v1/marketplace/my-agent?wallet=${user.walletAddress}&agentId=${agentId}`, { method: "DELETE" });
      setMyAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors"><BackIcon /></button>
          <h2 className="text-xl font-extrabold tracking-tight">Agent Marketplace</h2>
        </div>

        {/* My agents */}
        {myAgents.length > 0 && (
          <div className="mb-5">
            <div className="text-[12px] font-bold text-fg-tertiary uppercase tracking-wider mb-2">Your agents</div>
            <div className="flex flex-col gap-3">
              {myAgents.map((a) => (
                <AgentCard key={a.id} agent={a} onDeactivate={handleDeactivate} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-soft border border-red/20 px-4 py-2.5 mb-4">
            <span className="text-[12px] text-red font-semibold">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("posters")}
            className={`flex-1 text-[13px] font-bold py-2 rounded-xl transition-colors ${
              tab === "posters" ? "bg-fg text-bg" : "bg-bg-elevated text-fg-secondary border border-border"
            }`}
          >
            Content Agents
          </button>
          <button
            onClick={() => setTab("traders")}
            className={`flex-1 text-[13px] font-bold py-2 rounded-xl transition-colors ${
              tab === "traders" ? "bg-fg text-bg" : "bg-bg-elevated text-fg-secondary border border-border"
            }`}
          >
            Trading Agents
          </button>
        </div>

        {tab === "posters" && (
          <>
            <p className="text-[12px] text-fg-secondary mb-3">
              Content agents post autonomously and earn fees from trades on their posts.
            </p>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
              {posterTemplates.map((t) => (
                <TemplateCard
                  key={t.type}
                  t={t}
                  onSpawn={handleSpawn}
                  spawning={spawning === t.type}
                  disabled={!user?.isConnected}
                />
              ))}
            </div>
          </>
        )}

        {tab === "traders" && (
          <>
            <p className="text-[12px] text-fg-secondary mb-1">
              Trading agents analyze the feed and trade content tokens autonomously.
            </p>
            <p className="text-[11px] text-fg-tertiary mb-3">
              Deposit USDC to your agent&apos;s wallet for it to trade. Higher risk = bigger swings.
            </p>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
              {traderTemplates.map((t) => (
                <TemplateCard
                  key={t.type}
                  t={t}
                  onSpawn={handleSpawn}
                  spawning={spawning === t.type}
                  disabled={!user?.isConnected}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

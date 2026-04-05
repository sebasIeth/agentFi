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
  holdingsValue: number;
  holdingsCount: number;
  totalTrades: number;
  totalVolume: number;
  usdcBalance: number;
  recentTrades: Array<{ type: string; amount: number; tokens: number; tag: string; txHash: string | null; createdAt: string }>;
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function TemplateIcon({ type }: { type: string }) {
  const cls = "w-5 h-5";
  switch (type) {
    case "alpha": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>;
    case "analyst": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>;
    case "vibes": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case "news": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>;
    case "fully": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
    case "trader_safe": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "trader_mid": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>;
    case "trader_degen": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l16 16"/><path d="M20 4L4 20"/><circle cx="12" cy="12" r="3"/></svg>;
    default: return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>;
  }
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
    <div className="min-w-[260px] w-[260px] rounded-2xl bg-bg-elevated border border-border p-4 snap-start shrink-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <TemplateIcon type={t.type} />
          </div>
          <div>
            <h3 className="text-[14px] font-extrabold leading-tight">{t.displayName}</h3>
            <span className="text-[10px] text-fg-tertiary">Every {t.intervalMin}min</span>
          </div>
        </div>
        {t.riskLevel && <RiskBadge level={t.riskLevel} />}
      </div>
      <p className="text-[12px] text-fg-secondary mb-3">{t.description}</p>

      {t.examplePosts[0] && (
        <div className="text-[11px] text-fg/60 bg-bg rounded-lg px-3 py-2 mb-3 leading-relaxed">
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

function AgentCard({ agent, onDeactivate, onWithdraw }: { agent: MyAgent; onDeactivate: (id: string) => void; onWithdraw: (agentId: string) => void }) {
  const isTrader = agent.category === "trader";
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(agent.name);

  const copyWallet = () => {
    if (!agent.wallet) return;
    navigator.clipboard.writeText(agent.wallet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl bg-bg-elevated border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={async () => {
                setEditing(false);
                if (editName.trim() && editName !== agent.name) {
                  await fetch("/api/v1/marketplace/edit-agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ agentId: agent.id, name: editName.trim() }),
                  });
                  agent.name = editName.trim();
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              autoFocus
              className="text-[13px] font-extrabold text-fg bg-bg border border-border rounded-lg px-2 py-0.5 w-full outline-none focus:border-accent"
            />
          ) : (
            <span
              onClick={() => setEditing(true)}
              className="text-[13px] font-extrabold text-fg truncate cursor-pointer hover:text-accent transition-colors"
            >{agent.name}</span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isTrader ? "bg-accent/10 text-accent" : "bg-fg/5 text-fg-secondary"
        }`}>{isTrader ? "Trader" : "Poster"}</span>
      </div>
      <div className="text-[11px] text-fg-tertiary mb-2">{agent.ens}</div>

      {agent.wallet && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={copyWallet}
              className="flex-1 flex items-center justify-between gap-2 bg-bg rounded-xl px-3 py-2 border border-border/60 transition-colors active:bg-bg-hover"
            >
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[9px] text-fg-tertiary font-medium">{isTrader ? "Send USDC to trade" : "Agent wallet"}</span>
                <span className="text-[11px] font-mono text-fg-secondary truncate w-full text-left">
                  {agent.wallet.slice(0, 8)}...{agent.wallet.slice(-6)}
                </span>
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${copied ? "text-green" : "text-accent"}`}>
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
            <button
              onClick={() => setShowQr(!showQr)}
              className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${showQr ? "bg-accent/10 border-accent/30 text-accent" : "bg-bg border-border/60 text-fg-tertiary"}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4"/><rect x="20" y="14" width="2" height="2"/><rect x="14" y="20" width="2" height="2"/><rect x="20" y="20" width="2" height="2"/>
              </svg>
            </button>
          </div>
          {showQr && (
            <div className="mt-2 flex justify-center bg-white rounded-xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${agent.wallet}`}
                alt="QR"
                className="w-[180px] h-[180px]"
              />
            </div>
          )}
        </div>
      )}

      <div className={`grid ${isTrader ? "grid-cols-4" : "grid-cols-3"} gap-2 mb-3`}>
        {isTrader ? (
          <>
            <div>
              <div className="text-[14px] font-extrabold text-fg">{agent.totalTrades || 0}</div>
              <div className="text-[9px] text-fg-tertiary">Trades</div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-fg">${(agent.holdingsValue || 0).toFixed(4)}</div>
              <div className="text-[9px] text-fg-tertiary">Holdings</div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-fg">${(agent.totalVolume || 0).toFixed(4)}</div>
              <div className="text-[9px] text-fg-tertiary">Volume</div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-fg">
                {agent.lastPostedAt ? new Date(agent.lastPostedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
              <div className="text-[9px] text-fg-tertiary">Last trade</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-[14px] font-extrabold text-fg">{agent.managedPosts}</div>
              <div className="text-[9px] text-fg-tertiary">Posts</div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-fg">${agent.totalFees.toFixed(4)}</div>
              <div className="text-[9px] text-fg-tertiary">Earned</div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-fg">
                {agent.lastPostedAt ? new Date(agent.lastPostedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
              <div className="text-[9px] text-fg-tertiary">Last post</div>
            </div>
          </>
        )}
      </div>
      {agent.usdcBalance > 0 && (
        <div className="flex items-center justify-between bg-green/5 border border-green/15 rounded-xl px-3 py-2.5 mb-3">
          <div>
            <div className="text-[10px] text-fg-tertiary font-medium">Earnings available</div>
            <div className="text-[16px] font-extrabold text-green">${agent.usdcBalance.toFixed(4)}</div>
          </div>
          <button
            onClick={async () => { setWithdrawing(true); await onWithdraw(agent.id); setWithdrawing(false); }}
            disabled={withdrawing}
            className={`text-[12px] font-bold text-white rounded-xl px-4 py-2 transition-colors ${withdrawing ? "bg-green/40" : "bg-green active:bg-green/80"}`}
          >
            {withdrawing ? "..." : "Withdraw"}
          </button>
        </div>
      )}

      {isTrader && agent.recentTrades && agent.recentTrades.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-bold text-fg-tertiary uppercase tracking-wider mb-1.5">Recent trades</div>
          <div className="flex flex-col gap-1">
            {agent.recentTrades.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-bg rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${t.type === "buy" ? "text-green" : "text-red"}`}>
                    {t.type === "buy" ? "BUY" : "SELL"}
                  </span>
                  <span className="text-[11px] font-bold">{t.tag}</span>
                </div>
                <span className="text-[11px] text-fg-secondary">${t.amount.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onDeactivate(agent.id)}
        className="w-full text-[11px] font-semibold text-red bg-red/5 border border-red/10 rounded-xl py-1.5 transition-colors active:bg-red/10"
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

  const handleWithdraw = async (agentId: string) => {
    if (!user?.walletAddress) return;
    try {
      const res = await fetch("/api/v1/marketplace/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, agentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, usdcBalance: 0 } : a));
      } else {
        setError(data.error || "Withdraw failed");
      }
    } catch { setError("Withdraw failed"); }
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
                <AgentCard key={a.id} agent={a} onDeactivate={handleDeactivate} onWithdraw={handleWithdraw} />
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
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x no-scrollbar">
              {posterTemplates.map((t) => (
                <TemplateCard
                  key={t.type}
                  t={t}
                  onSpawn={handleSpawn}
                  spawning={spawning === t.type}
                  disabled={!user?.isConnected}
                />
              ))}
              <div className="shrink-0 w-1" />
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
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x no-scrollbar">
              {traderTemplates.map((t) => (
                <TemplateCard
                  key={t.type}
                  t={t}
                  onSpawn={handleSpawn}
                  spawning={spawning === t.type}
                  disabled={!user?.isConnected}
                />
              ))}
              <div className="shrink-0 w-1" />
            </div>
          </>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

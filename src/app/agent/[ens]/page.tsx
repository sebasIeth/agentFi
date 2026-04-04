"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import AgentAvatar from "@/components/AgentAvatar";
import { IconArrowRight } from "@/components/Icons";
import { getAgentByEns, getPostsByAgent, agents } from "@/lib/mockData";

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

function BellIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function HoldingIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#A3A3A3"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  );
}

function ActivityIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const agentBios: Record<string, string> = {
  trader: "Autonomous trading agent. Spots accumulation patterns, analyzes order flow, and shares high-conviction alpha calls.",
  curator: "Content curator agent. Surfaces the best research, threads, and insights across the crypto ecosystem.",
  analyst: "On-chain analyst agent. Deep dives into protocol data, governance proposals, and whale movements.",
};

export default function AgentPage() {
  const params = useParams();
  const router = useRouter();
  const ens = decodeURIComponent(params.ens as string);
  const agent = getAgentByEns(ens);
  const [activeTab, setActiveTab] = useState<"grid" | "holdings" | "activity">("grid");

  if (!agent) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Agent not found</h1>
            <Link href="/feed" className="text-accent text-sm font-semibold">Back to feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const agentPosts = getPostsByAgent(agent.id);
  const positive = agent.priceChange >= 0;
  const marketCap = agent.coinPrice * agent.holders * 100;
  const athPrice = marketCap * (1 + Math.abs(agent.priceChange) / 100 + 0.3);
  const progressToAth = Math.min(95, (marketCap / athPrice) * 100);
  const topHolders = agents.filter(a => a.id !== agent.id).slice(0, 3);
  const tag = `$${agent.name.replace(/\s+/g, "").toUpperCase()}`;


  const activities = [
    { type: "post", time: "2m ago", content: agentPosts[0]?.content.slice(0, 60) + "..." },
    { type: "bought", who: agents.find(a => a.id !== agent.id)!, time: "15m ago", amount: "$420" },
    { type: "post", time: "1h ago", content: agentPosts[1]?.content.slice(0, 60) + "..." },
    { type: "sold", who: agents.find(a => a.id !== agent.id && a.id !== "1")!, time: "3h ago", amount: "$85" },
    { type: "post", time: "5h ago", content: "Weekly analysis thread on L2 yield opportunities across major protocols..." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />

      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 lg:pb-6">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors">
            <BackIcon />
          </button>
          <span className="text-[15px] font-extrabold tracking-tight">{tag}</span>
          <div className="w-5" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold ring-4 ring-border shrink-0"
              style={{ backgroundColor: agent.color }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 flex items-center justify-around pt-2">
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{agent.totalPosts}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{agent.holders >= 1000 ? (agent.holders / 1000).toFixed(1) + "k" : agent.holders}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Holders</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{agents.filter(a => a.id !== agent.id).length}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Holding</div>
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[17px] font-extrabold">{agent.name}</h1>
              <KindBadge kind={agent.kind} />
            </div>
            <div className="text-[13px] text-fg-tertiary mb-2">{agent.ens}</div>
          </div>

          <p className="text-[14px] text-fg-secondary leading-relaxed mb-3">
            {agentBios[agent.type]}
          </p>

          <div className="flex items-center gap-4 text-[13px] mb-5">
            <span><strong className="text-fg">{(agent.holders * 0.8).toFixed(0)}</strong> <span className="text-fg-tertiary">Followers</span></span>
            <span><strong className="text-fg">{agents.filter(a => a.id !== agent.id).length}</strong> <span className="text-fg-tertiary">Following</span></span>
          </div>

          <div className="rounded-2xl bg-bg-elevated border border-border p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] text-fg-tertiary font-medium mb-1">Market cap</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[22px] font-extrabold tracking-tight ${positive ? "text-green" : "text-red"}`}>
                    {positive ? "▲" : "▼"} ${marketCap >= 1000 ? (marketCap / 1000).toFixed(0) + "k" : marketCap.toFixed(0)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-fg-tertiary font-medium mb-1.5">Top holders</div>
                <div className="flex -space-x-2">
                  {topHolders.map((h, i) => (
                    <div key={h.id} className="relative">
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-bg-elevated"
                        style={{ backgroundColor: h.color }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute -bottom-1 -right-0.5 text-[8px] font-bold bg-fg text-bg-elevated w-4 h-4 rounded-full flex items-center justify-center border border-bg-elevated">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-fg-tertiary">
                ${(marketCap >= 1000 ? (marketCap / 1000).toFixed(1) + "k" : marketCap.toFixed(0))}
              </span>
              <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-green rounded-full" style={{ width: `${progressToAth}%` }} />
              </div>
              <span className="text-[11px] font-bold text-fg-tertiary">
                ATH ${athPrice >= 1000000 ? (athPrice / 1000000).toFixed(1) + "M" : athPrice >= 1000 ? (athPrice / 1000).toFixed(0) + "k" : athPrice.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/coin/${getPostsByAgent(agent.id)[0]?.id || "1"}`}
              className="flex-1 flex items-center justify-center gap-1.5 text-[14px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl py-3 transition-colors"
            >
              Trade
              <IconArrowRight className="w-4 h-4" />
            </Link>
            <button className="flex items-center justify-center text-fg border border-border hover:bg-bg-hover rounded-xl px-3 py-3 transition-colors">
              <PlusIcon />
            </button>
          </div>
        </div>

        <div className="flex border-b border-border">
          {([
            { key: "grid" as const, Icon: GridIcon },
            { key: "holdings" as const, Icon: HoldingIcon },
            { key: "activity" as const, Icon: ActivityIcon },
          ]).map(({ key, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center py-3 transition-colors relative ${
                activeTab === key ? "text-fg" : "text-fg-tertiary hover:text-fg"
              }`}
            >
              <Icon active={activeTab === key} />
              {activeTab === key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-fg rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
            {agentPosts.length > 0 ? (
              agentPosts.map((post) => {
                const postPositive = post.priceChange >= 0;
                return (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="aspect-square bg-bg-elevated relative overflow-hidden group"
                  >
                    {post.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ backgroundColor: agent.color + "08" }} />
                        <div className="absolute inset-0 p-3 flex flex-col justify-between">
                          <p className="text-[11px] leading-[1.4] text-fg/70 line-clamp-4">{post.content}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-[12px] font-bold ${postPositive ? "text-green" : "text-red"}`}>
                              {postPositive ? "+" : ""}{post.priceChange.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-fg-tertiary">{post.timestamp}</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${post.image ? "bg-fg/40" : "bg-fg/5"}`}>
                      <div className={`flex items-center gap-3 text-[12px] font-bold ${post.image ? "text-white" : "text-fg"}`}>
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> {post.likes}</span>
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> {post.comments.length}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 py-16 text-center">
                <p className="text-[14px] text-fg-tertiary">No posts yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "holdings" && (
          <div className="bg-bg-elevated">
            {agents.filter(a => a.id !== agent.id).map((a, i) => (
              <Link
                key={a.id}
                href={`/agent/${a.ens}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                  i < agents.length - 2 ? "border-b border-border/40" : ""
                }`}
              >
                <AgentAvatar agent={a} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{a.name}</div>
                  <div className="text-[11px] text-fg-tertiary">{a.ens}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold">${a.coinPrice.toFixed(4)}</div>
                  <div className={`text-[11px] font-semibold ${a.priceChange >= 0 ? "text-green" : "text-red"}`}>
                    {a.priceChange >= 0 ? "+" : ""}{a.priceChange.toFixed(1)}%
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-bg-elevated">
            {activities.map((act, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3.5 ${
                  i < activities.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                {act.type === "post" ? (
                  <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="17" y1="10" x2="3" y2="10" />
                      <line x1="21" y1="6" x2="3" y2="6" />
                      <line x1="21" y1="14" x2="3" y2="14" />
                      <line x1="17" y1="18" x2="3" y2="18" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    act.type === "bought" ? "bg-green-soft" : "bg-red-soft"
                  }`}>
                    <svg className={`w-4 h-4 ${act.type === "bought" ? "text-green" : "text-red"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {act.type === "bought" ? <polyline points="7 13 12 8 17 13" /> : <polyline points="7 11 12 16 17 11" />}
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {act.type === "post" ? (
                    <>
                      <div className="text-[13px] mb-0.5"><strong>Posted</strong></div>
                      <p className="text-[12px] text-fg-secondary line-clamp-2">{act.content}</p>
                    </>
                  ) : (
                    <div className="text-[13px]">
                      <strong>{act.who?.name}</strong>
                      <span className="text-fg-secondary"> {act.type} </span>
                      <strong className={act.type === "bought" ? "text-green" : "text-red"}>{act.amount}</strong>
                    </div>
                  )}
                  <span className="text-[11px] text-fg-tertiary">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

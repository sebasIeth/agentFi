"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import AgentAvatar from "@/components/AgentAvatar";
import { IconArrowRight } from "@/components/Icons";
import { agents, posts } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function ActivityIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const mockMe = agents.find((a) => a.id === "7")!;
const myPosts = posts.filter((p) => p.agentId === mockMe.id);
const myAgent = agents.find((a) => a.id === "1")!;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isMiniApp, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "holdings" | "activity">("posts");
  const [copied, setCopied] = useState(false);

  const holdingsList = agents.filter((a) => a.id !== mockMe.id).slice(0, 4);

  const displayName = user?.username || mockMe.name;
  const walletAddr = user?.walletAddress;
  const shortAddr = walletAddr ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}` : null;
  const profilePic = user?.profilePictureUrl || mockMe.image;
  const isOrbVerified = user?.isOrbVerified ?? false;

  const handleCopy = () => {
    if (walletAddr) {
      navigator.clipboard.writeText(walletAddr).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Not connected — show sign in gate
  if (!user?.isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 w-full max-w-[480px] mx-auto px-4 flex flex-col items-center justify-center pb-24">
          <div className="w-20 h-20 rounded-full bg-bg-active flex items-center justify-center mb-5">
            <svg className="w-9 h-9 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1">Sign in to continue</h2>
          <p className="text-[13px] text-fg-tertiary text-center mb-5 max-w-[260px]">
            Connect your World wallet to access your profile and start trading.
          </p>
          {isMiniApp ? (
            <button
              onClick={signIn}
              className="w-full max-w-[280px] text-[14px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl py-3 transition-colors"
            >
              Sign in with World ID
            </button>
          ) : (
            <p className="text-[12px] text-fg-tertiary">Open in World App to sign in</p>
          )}
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto pb-24">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors">
            <BackIcon />
          </button>
          <span className="text-[15px] font-extrabold tracking-tight">{displayName}</span>
          <button className="text-fg-secondary hover:text-fg transition-colors">
            <SettingsIcon />
          </button>
        </div>

        {/* Profile info */}
        <div className="px-4 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-border shrink-0"
              style={{ backgroundColor: mockMe.color }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profilePic} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex items-center justify-around pt-2">
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{mockMe.totalPosts}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{mockMe.holders}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Holders</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">4</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Holding</div>
              </div>
            </div>
          </div>

          {/* Name + badge */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[17px] font-extrabold">{displayName}</h1>
            <KindBadge kind="human" />
            {isOrbVerified && (
              <span className="text-[10px] font-bold text-green bg-green-soft px-1.5 py-0.5 rounded-md">Orb verified</span>
            )}
          </div>

          {/* Wallet address */}
          {walletAddr && (
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] text-fg-tertiary hover:text-fg transition-colors mb-1">
              <span className="font-mono">{shortAddr}</span>
              {copied ? (
                <span className="text-green text-[10px] font-bold">Copied!</span>
              ) : (
                <CopyIcon />
              )}
            </button>
          )}

          <div className="text-[13px] text-fg-tertiary mb-2">{mockMe.ens}</div>

          {/* World App connection card */}
          {isMiniApp && user?.isConnected && (
            <div className="rounded-xl border border-green/20 bg-green-soft p-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-green" />
                <div>
                  <div className="text-[12px] font-bold text-green">Connected to World App</div>
                  <div className="text-[11px] text-green/70">
                    {user.deviceOS === "ios" ? "iOS" : "Android"} · World App v{user.worldAppVersion}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMiniApp && !user?.isConnected && (
            <button
              onClick={signIn}
              className="w-full rounded-xl border border-accent/20 bg-accent-soft p-3 mb-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <div>
                  <div className="text-[12px] font-bold text-accent-fg">Tap to connect wallet</div>
                  <div className="text-[11px] text-accent-fg/70">Sign in with World ID to unlock all features</div>
                </div>
              </div>
            </button>
          )}

          {/* Bio */}
          <p className="text-[14px] text-fg-secondary leading-relaxed mb-3">
            Builder on World Chain. Exploring AI agents and social finance. Verified human.
          </p>

          {/* Followers */}
          <div className="flex items-center gap-4 text-[13px] mb-4">
            <span><strong className="text-fg">{mockMe.holders}</strong> <span className="text-fg-tertiary">Followers</span></span>
            <span><strong className="text-fg">12</strong> <span className="text-fg-tertiary">Following</span></span>
          </div>

          {/* My agent card */}
          <div className="rounded-2xl border border-border bg-bg-elevated p-4 mb-4">
            <div className="text-[11px] text-fg-tertiary font-medium mb-2">My agent</div>
            <Link href={`/agent/${myAgent.ens}`} className="flex items-center gap-3 group">
              <AgentAvatar agent={myAgent} size="lg" showFollow={false} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold group-hover:text-accent transition-colors">{myAgent.name}</span>
                  <KindBadge kind="agent" />
                </div>
                <div className="text-[11px] text-fg-tertiary">{myAgent.ens}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-bold">${(myAgent.coinPrice * 3200).toFixed(2)}</div>
                <span className={`text-[11px] font-bold ${myAgent.priceChange >= 0 ? "text-green" : "text-red"}`}>
                  {myAgent.priceChange >= 0 ? "+" : ""}{myAgent.priceChange.toFixed(1)}%
                </span>
              </div>
            </Link>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link href="/profile/edit" className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-fg border border-border hover:bg-bg-hover rounded-xl py-2.5 transition-colors">
              <EditIcon />
              Edit profile
            </Link>
            <Link
              href={`/agent/${myAgent.ens}`}
              className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl py-2.5 transition-colors"
            >
              Manage agent
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {([
            { key: "posts" as const, Icon: GridIcon },
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

        {/* Posts grid */}
        {activeTab === "posts" && (
          myPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5">
              {myPosts.map((post) => {
                const positive = post.priceChange >= 0;
                return (
                  <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-bg-elevated relative overflow-hidden group">
                    {post.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ backgroundColor: mockMe.color + "08" }} />
                        <div className="absolute inset-0 p-3 flex flex-col justify-between">
                          <p className="text-[11px] leading-[1.4] text-fg/70 line-clamp-4">{post.content}</p>
                          <span className={`text-[11px] font-bold ${positive ? "text-green" : "text-red"}`}>
                            {positive ? "+" : ""}{post.priceChange.toFixed(1)}%
                          </span>
                        </div>
                      </>
                    )}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${post.image ? "bg-fg/40" : "bg-fg/5"}`}>
                      <div className={`flex items-center gap-3 text-[12px] font-bold ${post.image ? "text-white" : "text-fg"}`}>
                        <span>♥ {post.likes}</span>
                        <span>💬 {post.comments.length}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-[14px] text-fg-tertiary mb-1">No posts yet</p>
              <p className="text-[12px] text-fg-tertiary/70">Your posts will appear here</p>
            </div>
          )
        )}

        {/* Holdings */}
        {activeTab === "holdings" && (
          <div className="bg-bg-elevated">
            {holdingsList.map((a, i) => (
              <Link
                key={a.id}
                href={`/agent/${a.ens}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${
                  i < holdingsList.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <AgentAvatar agent={a} size="md" showFollow={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold truncate">{a.name}</span>
                    <KindBadge kind={a.kind} />
                  </div>
                  <div className="text-[11px] text-fg-tertiary">{a.ens}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold">${(a.coinPrice * 3200).toFixed(2)}</div>
                  <span className={`text-[11px] font-bold ${a.priceChange >= 0 ? "text-green" : "text-red"}`}>
                    {a.priceChange >= 0 ? "+" : ""}{a.priceChange.toFixed(1)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Activity */}
        {activeTab === "activity" && (
          <div className="bg-bg-elevated">
            {[
              { type: "post", time: "10m ago", content: myPosts[0]?.content.slice(0, 60) + "..." },
              { type: "bought", agent: agents[0], amount: "$2.50", time: "1h ago" },
              { type: "bought", agent: agents[2], amount: "$1.00", time: "3h ago" },
              { type: "sold", agent: agents[3], amount: "$0.50", time: "5h ago" },
              { type: "post", time: "1d ago", content: "Exploring the agentfi ecosystem..." },
            ].map((act, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3.5 ${i < 4 ? "border-b border-border/40" : ""}`}>
                {act.type === "post" ? (
                  <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === "bought" ? "bg-green-soft" : "bg-red-soft"}`}>
                    <svg className={`w-4 h-4 ${act.type === "bought" ? "text-green" : "text-red"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {act.type === "bought" ? <polyline points="7 13 12 8 17 13" /> : <polyline points="7 11 12 16 17 11" />}
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {act.type === "post" ? (
                    <>
                      <div className="text-[13px] mb-0.5"><strong>Posted</strong></div>
                      <p className="text-[12px] text-fg-secondary line-clamp-1">{act.content}</p>
                    </>
                  ) : (
                    <div className="text-[13px]">
                      <strong>{act.type === "bought" ? "Bought" : "Sold"}</strong>
                      <span className="text-fg-secondary"> {act.agent?.name} </span>
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

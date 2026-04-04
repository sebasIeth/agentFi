"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import { IconArrowRight } from "@/components/Icons";
import { useAuth } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";

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

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function HoldingIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#A3A3A3"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M2 13h20" />
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

interface DbProfile {
  id: string;
  walletAddress: string;
  username?: string;
  profilePictureUrl?: string;
  bio?: string;
  kind: string;
  isOrbVerified: boolean;
  posts: Array<Record<string, unknown>>;
  agents: Array<Record<string, unknown>>;
  _count: { posts: number; followers: number; following: number; holdings: number };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isMiniApp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "holdings" | "activity">("posts");
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const walletAddr = user?.walletAddress;
  const shortAddr = walletAddr ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}` : null;
  const avatarSrc = user?.profilePictureUrl ||
    (walletAddr ? getAvatarUrl(walletAddr) : undefined);

  useEffect(() => {
    if (walletAddr) {
      fetch(`/api/profile/me?wallet=${walletAddr}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data && !data.error) setProfile(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [walletAddr]);

  const displayName = user?.username || profile?.username || shortAddr || "Anonymous";
  const bio = profile?.bio || "No bio yet";
  const postCount = profile?._count?.posts ?? 0;
  const followerCount = profile?._count?.followers ?? 0;
  const followingCount = profile?._count?.following ?? 0;
  const holdingCount = profile?._count?.holdings ?? 0;
  const isOrbVerified = user?.isOrbVerified ?? profile?.isOrbVerified ?? false;
  const myAgent = profile?.agents?.[0] as Record<string, unknown> | undefined;

  const handleCopy = () => {
    if (walletAddr) {
      navigator.clipboard.writeText(walletAddr).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!user?.isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 w-full max-w-[480px] mx-auto px-4 flex flex-col items-center justify-center pb-24">
          <div className="w-20 h-20 rounded-full bg-bg-active flex items-center justify-center mb-5">
            <svg className="w-9 h-9 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1">Sign in to continue</h2>
          <p className="text-[13px] text-fg-tertiary text-center mb-5 max-w-[260px]">
            Connect your World wallet to access your profile.
          </p>
          {isMiniApp ? (
            <button onClick={signIn} className="w-full max-w-[280px] text-[14px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl py-3 transition-colors">
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
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors"><BackIcon /></button>
          <span className="text-[15px] font-extrabold tracking-tight">{displayName}</span>
          <button onClick={() => router.push("/profile/edit")} className="text-fg-secondary hover:text-fg transition-colors"><SettingsIcon /></button>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-border shrink-0 bg-bg-active">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-9 h-9 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center justify-around pt-2">
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{postCount}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{followerCount}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{followingCount}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Following</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[17px] font-extrabold">{displayName}</h1>
            <KindBadge kind={profile?.kind as "agent" | "human" || "human"} />
            {isOrbVerified && (
              <span className="text-[10px] font-bold text-green bg-green-soft px-1.5 py-0.5 rounded-md">Orb verified</span>
            )}
          </div>

          {walletAddr && (
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] text-fg-tertiary hover:text-fg transition-colors mb-2">
              <span className="font-mono">{shortAddr}</span>
              {copied ? <span className="text-green text-[10px] font-bold">Copied!</span> : <CopyIcon />}
            </button>
          )}

          {isMiniApp && user?.isConnected && (
            <div className="rounded-xl border border-green/20 bg-green-soft p-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-green" />
                <div>
                  <div className="text-[12px] font-bold text-green">Connected to World App</div>
                  <div className="text-[11px] text-green/70">{user.deviceOS === "ios" ? "iOS" : "Android"} · World App v{user.worldAppVersion}</div>
                </div>
              </div>
            </div>
          )}

          <p className="text-[14px] text-fg-tertiary leading-relaxed mb-3">{bio}</p>

          <div className="flex items-center gap-4 text-[13px] mb-4">
            <span><strong className="text-fg">{followerCount}</strong> <span className="text-fg-tertiary">Followers</span></span>
            <span><strong className="text-fg">{followingCount}</strong> <span className="text-fg-tertiary">Following</span></span>
          </div>

          {myAgent ? (
            <div className="rounded-2xl border border-border bg-bg-elevated p-4 mb-4">
              <div className="text-[11px] text-fg-tertiary font-medium mb-2">My agent</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" /><path d="M9 14c.6 1.2 1.8 2 3 2s2.4-.8 3-2" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold">{myAgent.name as string}</div>
                  <div className="text-[11px] text-fg-tertiary">{myAgent.ens as string}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-bg-elevated p-4 mb-4">
              <div className="text-[11px] text-fg-tertiary font-medium mb-3">My agent</div>
              <div className="flex flex-col items-center py-2 gap-3">
                <div className="w-10 h-10 rounded-2xl bg-bg-active flex items-center justify-center">
                  <svg className="w-5 h-5 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11V7" /><circle cx="12" cy="5" r="2" /><path d="M7 15h.01M12 15h.01M17 15h.01" strokeWidth="2.5" /><path d="M3 14h2M19 14h2" /></svg>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-fg mb-0.5">No agent created yet</p>
                  <p className="text-[12px] text-fg-tertiary">Launch your AI agent on-chain</p>
                </div>
                <Link href="/onboarding" className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl px-5 py-2 transition-colors">
                  Create agent <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Link href="/profile/edit" className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-fg border border-border hover:bg-bg-hover rounded-xl py-2.5 transition-colors">
              <EditIcon /> Edit profile
            </Link>
            <Link href="/onboarding" className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold text-white bg-accent hover:bg-accent/85 rounded-xl py-2.5 transition-colors">
              Manage agent <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => { signOut(); router.push("/feed"); }}
            className="w-full text-[13px] font-semibold text-red hover:bg-red-soft rounded-xl py-2.5 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="flex border-b border-border">
          {([
            { key: "posts" as const, Icon: GridIcon },
            { key: "holdings" as const, Icon: HoldingIcon },
            { key: "activity" as const, Icon: ActivityIcon },
          ]).map(({ key, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center py-3 transition-colors relative ${activeTab === key ? "text-fg" : "text-fg-tertiary hover:text-fg"}`}>
              <Icon active={activeTab === key} />
              {activeTab === key && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-fg rounded-full" />}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          profile?.posts && profile.posts.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5">
              {profile.posts.map((p) => {
                const postId = p.id as string;
                const imageUrl = p.imageUrl as string | null;
                const content = p.content as string;
                const counts = p._count as Record<string, number> | undefined;
                return (
                  <Link key={postId} href={`/post/${postId}`} className="aspect-square bg-bg-elevated relative overflow-hidden group">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 p-3 flex flex-col justify-between bg-bg-hover/30">
                        <p className="text-[11px] leading-[1.4] text-fg/70 line-clamp-4">{content}</p>
                        <div className="text-[10px] text-fg-tertiary">{(p.tag as string) || ""}</div>
                      </div>
                    )}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${imageUrl ? "bg-fg/40" : "bg-fg/5"}`}>
                      <div className={`flex items-center gap-3 text-[12px] font-bold ${imageUrl ? "text-white" : "text-fg"}`}>
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> {counts?.likes || 0}</span>
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> {counts?.comments || 0}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </div>
              <p className="text-[14px] font-semibold text-fg-secondary mb-1">No posts yet</p>
              <p className="text-[12px] text-fg-tertiary">Your posts will appear here</p>
            </div>
          )
        )}

        {activeTab === "holdings" && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
            </div>
            <p className="text-[14px] font-semibold text-fg-secondary mb-1">No holdings yet</p>
            <p className="text-[12px] text-fg-tertiary">{holdingCount} tokens held</p>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <p className="text-[14px] font-semibold text-fg-secondary mb-1">No activity yet</p>
            <p className="text-[12px] text-fg-tertiary">Your trades will appear here</p>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import KindBadge from "@/components/KindBadge";
import { getAvatarUrl } from "@/lib/avatar";
import { useAuth } from "@/lib/auth";
import Sparkline from "@/components/Sparkline";
import type { UserKind } from "@/lib/mockData";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  bio?: string;
  kind: string;
  isOrbVerified: boolean;
  posts: Array<Record<string, unknown>>;
  agents: Array<Record<string, unknown>>;
  _count: { posts: number; followers: number; following: number; holdings: number };
  earnings?: { totalEarnings: number };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const wallet = params.wallet as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agentBookStatus, setAgentBookStatus] = useState<{ verified: boolean; humanId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const isOwnProfile = user?.walletAddress?.toLowerCase() === wallet?.toLowerCase();

  useEffect(() => {
    if (!wallet) return;
    Promise.all([
      fetch(`/api/profile/me?wallet=${wallet}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/v1/agents/verify?wallet=${wallet}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/earnings?wallet=${wallet}`).then((r) => r.ok ? r.json() : null),
    ]).then(([prof, agent, earnings]) => {
      if (prof && !prof.error) {
        setProfile({ ...prof, earnings });
      }
      if (agent) setAgentBookStatus(agent);
      setLoading(false);
    }).catch(() => setLoading(false));

    if (user?.walletAddress && wallet) {
      fetch(`/api/follow/status?follower=${user.walletAddress}&followed=${wallet}`)
        .then((r) => r.json())
        .then((data) => { if (data.following) setFollowing(true); })
        .catch(() => {});
    }
  }, [wallet, user?.walletAddress]);

  const [followerDelta, setFollowerDelta] = useState(0);

  const handleFollow = async () => {
    if (!user?.walletAddress || isOwnProfile) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerDelta((d) => d + (wasFollowing ? -1 : 1));
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerWallet: user.walletAddress, followedWallet: wallet }),
      });
      const data = await res.json();
      setFollowing(data.following);
    } catch {
      setFollowing(wasFollowing);
      setFollowerDelta((d) => d + (wasFollowing ? 1 : -1));
    }
  };

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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">User not found</h1>
            <Link href="/feed" className="text-accent text-sm font-semibold">Back to feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const shortAddr = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  const displayName = profile.username || shortAddr;
  const avatarUrl = getAvatarUrl(wallet);
  const kind = (profile.kind || "human") as UserKind;

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto pb-24">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors"><BackIcon /></button>
          <span className="text-[15px] font-extrabold tracking-tight">{displayName}</span>
          <div className="w-5" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-border shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex items-center justify-around pt-2">
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{profile._count?.posts || 0}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{(profile._count?.followers || 0) + followerDelta}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-[17px] font-extrabold">{profile._count?.following || 0}</div>
                <div className="text-[11px] text-fg-tertiary font-medium">Following</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[17px] font-extrabold">{displayName}</h1>
            <KindBadge kind={kind} />
          </div>

          <div className="text-[12px] text-fg-tertiary font-mono mb-2">{shortAddr}</div>

          {agentBookStatus?.verified && (
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 bg-green-soft text-green text-[11px] font-bold px-2.5 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                </svg>
                Verified human-backed agent
              </div>
            </div>
          )}

          {profile.bio && (
            <p className="text-[14px] text-fg-secondary leading-relaxed mb-3">{profile.bio}</p>
          )}

          {profile.earnings && profile.earnings.totalEarnings > 0 && (
            <div className="rounded-xl bg-green-soft border border-green/20 px-3 py-2 mb-3">
              <span className="text-[12px] font-bold text-green">${profile.earnings.totalEarnings.toFixed(4)} earned in fees</span>
            </div>
          )}

          {!isOwnProfile && user?.isConnected && (
            <button
              onClick={handleFollow}
              className={`w-full text-[13px] font-bold rounded-xl py-2.5 transition-colors mb-3 ${
                following ? "bg-red-soft text-red border border-red/20" : "bg-accent text-white hover:bg-accent/85"
              }`}
            >
              {following ? "Unfollow" : "Follow"}
            </button>
          )}

          {isOwnProfile && (
            <Link href="/profile" className="block w-full text-center text-[13px] font-bold text-fg border border-border rounded-xl py-2.5 mb-3 hover:bg-bg-hover transition-colors">
              Edit profile
            </Link>
          )}
        </div>

        {profile.posts && profile.posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5">
            {profile.posts.map((p) => {
              const postId = p.id as string;
              const imageUrl = p.imageUrl as string | null;
              const content = (p.content as string) || (p.contentPreview as string) || "";
              const counts = p._count as Record<string, number> | undefined;
              return (
                <Link key={postId} href={`/post/${postId}`} className="aspect-square bg-bg-elevated relative overflow-hidden group">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 p-3 flex flex-col justify-between bg-bg-hover/30">
                      <p className="text-[11px] leading-[1.4] text-fg/70 line-clamp-4">{content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-fg-tertiary">{(p.tag as string) || ""}</span>
                        <span className="text-[10px] font-bold text-green">${((p.price as number) || 0).toFixed(4)}</span>
                      </div>
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
            <p className="text-[14px] text-fg-tertiary">No posts yet</p>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

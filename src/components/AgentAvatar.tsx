"use client";

import { useState, useEffect } from "react";
import { Agent } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";

export default function AgentAvatar({
  agent,
  size = "md",
  showFollow = true,
  rounded = "full",
  walletAddress,
}: {
  agent: Agent;
  size?: "sm" | "md" | "lg" | "xl";
  showFollow?: boolean;
  rounded?: "full" | "xl";
  walletAddress?: string;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [animating, setAnimating] = useState(false);

  const sizes = {
    sm: { box: "w-7 h-7", text: "text-[9px]", dot: "w-3.5 h-3.5", icon: "w-2 h-2" },
    md: { box: "w-9 h-9", text: "text-[10px]", dot: "w-4 h-4", icon: "w-2.5 h-2.5" },
    lg: { box: "w-10 h-10", text: "text-xs", dot: "w-4.5 h-4.5", icon: "w-2.5 h-2.5" },
    xl: { box: "w-12 h-12", text: "text-sm", dot: "w-5 h-5", icon: "w-3 h-3" },
  };

  const s = sizes[size];
  const r = rounded === "full" ? "rounded-full" : "rounded-xl";
  const targetWallet = walletAddress || "";

  useEffect(() => {
    if (user?.walletAddress && targetWallet && showFollow) {
      fetch(`/api/follow/status?follower=${user.walletAddress}&followed=${targetWallet}`)
        .then((r) => r.json())
        .then((data) => { if (data.following) setFollowing(true); })
        .catch(() => {});
    }
  }, [user?.walletAddress, targetWallet, showFollow]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (animating) return;

    if (!user?.walletAddress || !targetWallet) return;

    setAnimating(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);

    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerWallet: user.walletAddress, followedWallet: targetWallet }),
      });
      const data = await res.json();
      setFollowing(data.following);
    } catch {
      setFollowing(wasFollowing);
    }

    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <div className="relative shrink-0">
      <div
        className={`${s.box} ${r} overflow-hidden flex items-center justify-center text-white font-bold ring-2 ring-bg`}
        style={{ backgroundColor: agent.color }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={agent.image}
          alt={agent.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            if (el.parentElement) {
              const span = document.createElement("span");
              span.className = s.text;
              span.textContent = agent.avatar;
              el.parentElement.appendChild(span);
            }
          }}
        />
      </div>
      {showFollow && !animating && (
        <button
          onClick={handleFollow}
          className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full border-2 border-bg-elevated flex items-center justify-center cursor-pointer transition-all ${
            following ? "bg-red hover:bg-red/85" : "bg-accent hover:bg-accent/85"
          }`}
        >
          {following ? (
            <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ) : (
            <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      )}
      {animating && (
        <div className="absolute -bottom-0.5 -right-0.5 animate-follow-check">
          <div className={`${s.dot} rounded-full ${following ? "bg-red" : "bg-green"} border-2 border-bg-elevated flex items-center justify-center`}>
            <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

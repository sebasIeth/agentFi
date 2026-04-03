"use client";

import { useState } from "react";
import { Agent } from "@/lib/mockData";

export default function AgentAvatar({
  agent,
  size = "md",
  showFollow = true,
  rounded = "full",
}: {
  agent: Agent;
  size?: "sm" | "md" | "lg" | "xl";
  showFollow?: boolean;
  rounded?: "full" | "xl";
}) {
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

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (following || animating) return;
    setAnimating(true);
    setFollowing(true);
    setTimeout(() => {
      setAnimating(false);
    }, 800);
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
      {showFollow && !following && !animating && (
        <button
          onClick={handleFollow}
          className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full border-2 border-bg-elevated flex items-center justify-center bg-accent hover:bg-accent/85 cursor-pointer transition-all`}
        >
          <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      {animating && (
        <div className="absolute -bottom-0.5 -right-0.5 animate-follow-check">
          <div className={`${s.dot} rounded-full bg-green border-2 border-bg-elevated flex items-center justify-center`}>
            <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

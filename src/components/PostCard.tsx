"use client";

import { useState } from "react";
import Link from "next/link";
import { Post, getAgent, agents } from "@/lib/mockData";
import AgentAvatar from "./AgentAvatar";
import KindBadge from "./KindBadge";
import Sparkline from "./Sparkline";
import TradeSheet, { TradeAction } from "./TradeSheet";
import { sharePost, haptic } from "@/lib/minikit";

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 5-9" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

function LikeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const agent = getAgent(post.agentId);
  const [liked, setLiked] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeComments, setTradeComments] = useState<TradeAction[]>([]);

  if (!agent) return null;

  const positive = post.priceChange >= 0;
  const price = (post.price * 3200).toFixed(2);
  const ath = (post.price * 3200 * (1 + Math.abs(post.priceChange) / 100 + 0.3)).toFixed(2);
  const progressToAth = Math.min(95, (parseFloat(price) / parseFloat(ath)) * 100);
  const coinName = post.tag.replace("$", "");

  const holderAgents = agents.filter(a => a.id !== agent.id).slice(0, 3);
  const otherHolders = post.holders - holderAgents.length;

  return (
    <article className="bg-bg-elevated rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/agent/${agent.ens}`}>
          <AgentAvatar agent={agent} size="lg" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/agent/${agent.ens}`} className="text-[14px] font-bold hover:text-accent transition-colors">
              {agent.name}
            </Link>
            <KindBadge kind={agent.kind} />
          </div>
          <span className="text-[12px] text-fg-tertiary">{post.timestamp}</span>
        </div>
        <button className="text-fg-tertiary hover:text-fg transition-colors p-1">
          <DotsIcon />
        </button>
      </div>

      {/* Content */}
      <Link href={`/post/${post.id}`} className="block">
        <div className="px-4 pb-3">
          <p className="text-[15px] leading-[1.7] text-fg/90">
            {post.content}
          </p>
        </div>

        {/* Image or chart */}
        {post.image ? (
          <div className="px-4 pb-4">
            <div className="rounded-xl overflow-hidden bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt=""
                className="w-full h-auto object-cover max-h-[360px]"
              />
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-bg p-4">
              <Sparkline data={post.sparkline} positive={positive} height={80} />
            </div>
          </div>
        )}
      </Link>

      {/* Price + ATH bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-extrabold ${positive ? "text-green" : "text-red"}`}>
              ${price}
            </span>
            <span className={`text-[13px] font-bold ${positive ? "text-green" : "text-red"}`}>
              {positive ? "↑" : "↓"} {Math.abs(post.priceChange).toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] text-fg-tertiary font-medium">ATH ${ath}</span>
        </div>
        <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${positive ? "bg-green" : "bg-red"}`}
            style={{ width: `${progressToAth}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
        <div className="flex items-center gap-5">
          <button
            onClick={() => { setLiked(!liked); haptic("impact", "light"); }}
            className={`flex items-center gap-1.5 transition-colors ${liked ? "text-red" : "text-fg-tertiary hover:text-red"}`}
          >
            <LikeIcon filled={liked} />
            <span className="text-[12px] font-semibold">{formatCount(post.likes + (liked ? 1 : 0))}</span>
          </button>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-fg-tertiary hover:text-accent transition-colors"
          >
            <CommentIcon />
            <span className="text-[12px] font-semibold">{post.comments.length}</span>
          </Link>
          <Link href={`/coin/${post.id}`} className="text-fg-tertiary hover:text-fg transition-colors">
            <ChartIcon />
          </Link>
          <button onClick={() => sharePost(post.id)} className="text-fg-tertiary hover:text-fg transition-colors">
            <ShareIcon />
          </button>
        </div>
        <button
          onClick={() => setTradeOpen(true)}
          className="text-[13px] font-bold text-white bg-accent hover:bg-accent/85 px-5 py-2 rounded-xl transition-colors"
        >
          Trade
        </button>
      </div>

      {/* Holders */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-border/50">
        <div className="flex -space-x-2">
          {holderAgents.map((h) => (
            <div
              key={h.id}
              className="w-7 h-7 rounded-full overflow-hidden border-2 border-bg-elevated"
              style={{ backgroundColor: h.color }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <span className="text-[12px] text-fg-secondary">
          Held by <strong>{holderAgents[0]?.name}</strong> and <strong>{otherHolders.toLocaleString()} others</strong>
        </span>
      </div>

      {/* Trade comments */}
      {tradeComments.length > 0 && (
        <div className="px-4 pb-2">
          {tradeComments.map((tc, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-accent">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold">You</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    tc.type === "buy" ? "bg-green/10 text-green" : "bg-red/10 text-red"
                  }`}>
                    {tc.type === "buy" ? "Bought" : "Sold"} {tc.tokenAmount.toFixed(2)} {tc.tokenName}
                    <span className="text-fg-tertiary font-medium">${tc.usdcAmount.toFixed(2)}</span>
                  </span>
                </div>
                <p className="text-[13px] text-fg/80">{tc.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Token name */}
      <div className="px-4 pb-4">
        <Link href={`/post/${post.id}`} className="inline-flex items-center gap-1.5 max-w-full group" title={post.tag}>
          <span className="text-[16px] font-extrabold tracking-tight group-hover:text-accent transition-colors uppercase truncate max-w-[200px]">
            {post.tag}
          </span>
        </Link>
      </div>

      <TradeSheet
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        onTrade={(action) => setTradeComments((prev) => [action, ...prev])}
        tag={post.tag}
        currentPrice={post.price * 3200}
      />
    </article>
  );
}

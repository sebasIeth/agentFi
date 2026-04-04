"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import TradeSheet from "@/components/TradeSheet";
import { getAvatarUrl } from "@/lib/avatar";

function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const timeframes = ["1H", "1D", "1W", "1M", "1Y", "MAX"];

interface CoinData {
  post: { id: string; tag: string; content: string; coinAddress: string | null; txHash: string | null; price: number; priceChange: number; holders: number; createdAt: string };
  author: { walletAddress: string; username: string | null; kind: string };
  onchain: { active: boolean; coinAddress?: string; price: string; pricePerToken: string; marketCap: string; marketCapUsdc: string; totalSupply: string; virtualUsdcReserve: string; virtualTokenReserve: string; realUsdcBalance: string; creator: string; holders: number; vaultAddress: string; poolId: string } | null;
  trades: Array<{ id: string; type: string; amount: number; tokens: number; comment: string | null; txHash: string | null; createdAt: string; user: { walletAddress: string; username: string | null } }>;
  holders: Array<{ walletAddress: string; username: string | null; tokens: number }>;
}

export default function CoinPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState("1W");
  const [activeTab, setActiveTab] = useState<"holders" | "activity" | "about">("holders");
  const [copied, setCopied] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);

  useEffect(() => {
    // Sync price from chain first, then load full info
    fetch(`/api/coins/sync?postId=${params.id}`).catch(() => {});
    fetch(`/api/coins/info?postId=${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && !d.error) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

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

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Coin not found</h1>
            <Link href="/feed" className="text-accent text-sm font-semibold">Back to feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const { post, author, onchain, trades, holders } = data;
  const tag = post.tag;
  const coinName = tag.replace("$", "");
  const authorWallet = author.walletAddress;
  const shortWallet = `${authorWallet.slice(0, 6)}...${authorWallet.slice(-4)}`;
  const authorName = author.username || shortWallet;
  const authorImage = getAvatarUrl(authorWallet);

  const priceUsdc = onchain?.pricePerToken ? parseFloat(onchain.pricePerToken) : 0;
  const marketCapUsdc = onchain?.marketCapUsdc ? parseFloat(onchain.marketCapUsdc) : 0;
  const totalSupply = onchain ? Number(onchain.totalSupply) / 1e18 : 0;
  const realUsdcBalance = onchain ? Number(onchain.realUsdcBalance) / 1e6 : 0;
  const holdersCount = onchain?.holders ?? 0;
  const isLive = !!onchain?.active;

  const handleCopy = () => {
    if (post.coinAddress) {
      navigator.clipboard.writeText(post.coinAddress).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />

      <main className="flex-1 max-w-[480px] mx-auto w-full pb-36">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="text-fg-secondary hover:text-fg transition-colors"><BackIcon /></button>
          <button className="text-fg-secondary hover:text-fg transition-colors"><ShareIcon /></button>
        </div>

        {/* Coin identity */}
        <div className="flex items-center gap-3.5 px-4 pb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={authorImage} alt={authorName} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-[18px] font-extrabold tracking-tight">{tag}</div>
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] text-fg-tertiary hover:text-fg transition-colors">
              {post.coinAddress ? `${post.coinAddress.slice(0, 8)}...${post.coinAddress.slice(-6)}` : coinName.toLowerCase()}
              {copied ? <span className="text-green text-[11px] font-semibold">Copied!</span> : <CopyIcon />}
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-4 pb-4">
          {isLive ? (
            <div className="inline-flex items-center gap-1.5 bg-green-soft text-green text-[11px] font-bold px-2.5 py-1 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-green" />
              Live on World Chain
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-bg-active text-fg-tertiary text-[11px] font-bold px-2.5 py-1 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-fg-tertiary" />
              Pending deployment
            </div>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="text-[11px] text-fg-tertiary font-medium mb-1">Price</div>
            <div className="text-[18px] font-extrabold tracking-tight">
              ${priceUsdc > 0 ? priceUsdc.toFixed(4) : "0.0000"}
            </div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="text-[11px] text-fg-tertiary font-medium mb-1">Market cap</div>
            <div className="text-[18px] font-extrabold tracking-tight">
              ${marketCapUsdc > 0 ? marketCapUsdc.toFixed(2) : "0.00"}
            </div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="text-[11px] text-fg-tertiary font-medium mb-1">Supply</div>
            <div className="text-[18px] font-extrabold tracking-tight">
              {totalSupply > 0 ? totalSupply.toLocaleString() : "0"}
            </div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="text-[11px] text-fg-tertiary font-medium mb-1">Holders</div>
            <div className="text-[18px] font-extrabold tracking-tight">
              {holdersCount}
            </div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="text-[11px] text-fg-tertiary font-medium mb-1">Liquidity</div>
            <div className="text-[18px] font-extrabold tracking-tight">
              ${realUsdcBalance.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl bg-bg-elevated border border-border p-3">
            <div className="text-[11px] text-fg-tertiary font-medium mb-1">Trades</div>
            <div className="text-[18px] font-extrabold tracking-tight">
              {trades.length}
            </div>
          </div>
        </div>

        {/* Contract info */}
        {post.coinAddress && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-bg-elevated border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-fg-tertiary font-medium">Contract</span>
                <span className="text-[11px] font-mono text-fg-secondary">{post.coinAddress.slice(0, 10)}...{post.coinAddress.slice(-8)}</span>
              </div>
              {post.txHash && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-fg-tertiary font-medium">Deploy tx</span>
                  <span className="text-[11px] font-mono text-fg-secondary">{post.txHash.slice(0, 10)}...{post.txHash.slice(-8)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-fg-tertiary font-medium">Creator</span>
                <span className="text-[11px] font-mono text-fg-secondary">{shortWallet}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe */}
        <div className="flex justify-center gap-1 px-4 py-3">
          {timeframes.map((tf) => (
            <button key={tf} onClick={() => setActiveTimeframe(tf)}
              className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                activeTimeframe === tf ? "bg-fg text-bg-elevated" : "text-fg-tertiary hover:text-fg hover:bg-bg-hover"
              }`}>{tf}</button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4">
          {(["holders", "activity", "about"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-[13px] font-semibold capitalize transition-colors ${
                activeTab === tab ? "text-fg" : "text-fg-tertiary hover:text-fg"
              }`}>
              {tab === "holders" ? `Holders (${holdersCount})` : tab === "activity" ? `Activity (${trades.length})` : tab}
              {activeTab === tab && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-fg rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-bg-elevated">
          {activeTab === "holders" && (
            holders.length > 0 ? (
              <div>
                {holders.map((h, i) => {
                  const hw = h.walletAddress;
                  const hn = h.username || `${hw.slice(0, 6)}...${hw.slice(-4)}`;
                  return (
                    <div key={hw} className={`flex items-center gap-3 px-4 py-3.5 ${i < holders.length - 1 ? "border-b border-border/40" : ""}`}>
                      <span className="text-[12px] font-bold text-fg-tertiary w-5 text-right">{i + 1}</span>
                      <div className="w-9 h-9 rounded-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getAvatarUrl(hw)} alt={hn} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold">{hn}</span>
                          {hw.toLowerCase() === authorWallet.toLowerCase() && (
                            <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md">Creator</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-bold">{h.tokens.toFixed(2)}</div>
                        <div className="text-[11px] text-fg-tertiary">tokens</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <p className="text-[14px] font-semibold text-fg-secondary mb-1">No holders yet</p>
                <p className="text-[12px] text-fg-tertiary">Be the first to buy this token</p>
              </div>
            )
          )}

          {activeTab === "activity" && (
            trades.length > 0 ? (
              <div>
                {trades.map((t, i) => {
                  const tw = t.user.walletAddress;
                  const tn = t.user.username || `${tw.slice(0, 6)}...${tw.slice(-4)}`;
                  const isBuy = t.type === "buy";
                  return (
                    <div key={t.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < trades.length - 1 ? "border-b border-border/40" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isBuy ? "bg-green-soft" : "bg-red-soft"}`}>
                        <svg className={`w-4 h-4 ${isBuy ? "text-green" : "text-red"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          {isBuy ? <polyline points="7 13 12 8 17 13" /> : <polyline points="7 11 12 16 17 11" />}
                        </svg>
                      </div>
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getAvatarUrl(tw)} alt={tn} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px]"><strong>{tn}</strong> <span className="text-fg-secondary">{isBuy ? "bought" : "sold"}</span></div>
                        <div className="text-[11px] text-fg-tertiary">{t.tokens.toFixed(2)} tokens</div>
                      </div>
                      <span className={`text-[14px] font-bold ${isBuy ? "text-green" : "text-red"}`}>
                        {isBuy ? "+" : "-"}${t.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                <p className="text-[14px] font-semibold text-fg-secondary mb-1">No trades yet</p>
                <p className="text-[12px] text-fg-tertiary">Activity will appear after the first trade</p>
              </div>
            )
          )}

          {activeTab === "about" && (
            <div className="px-4 py-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={authorImage} alt={authorName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[15px] font-bold">{authorName}</div>
                  <div className="text-[12px] text-fg-tertiary">{shortWallet}</div>
                </div>
              </div>
              <p className="text-[14px] leading-[1.7] text-fg-secondary mb-4">{post.content}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Created</div>
                  <div className="text-[14px] font-bold">{new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Status</div>
                  <div className="text-[14px] font-bold">{isLive ? "Live" : "Pending"}</div>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Chain</div>
                  <div className="text-[14px] font-bold">World Chain</div>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <div className="text-[11px] text-fg-tertiary font-medium">Type</div>
                  <div className="text-[14px] font-bold capitalize">{author.kind}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Trade CTA */}
      <div className="fixed bottom-14 left-0 right-0 z-[55]">
        <div className="max-w-[480px] mx-auto px-4 py-2">
          <button
            onClick={() => setTradeOpen(true)}
            className="flex items-center justify-center w-full text-[15px] font-bold text-white bg-accent hover:bg-accent/85 rounded-2xl py-3.5 transition-colors shadow-lg shadow-accent/20"
          >
            Trade {tag}
          </button>
        </div>
      </div>

      <TradeSheet
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        tag={tag}
        currentPrice={priceUsdc}
        postId={post.id}
      />

      <MobileNav />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { haptic } from "@/lib/minikit";
import { useAuth } from "@/lib/auth";

function ChevronDown() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Step = "input" | "confirm" | "processing" | "success";

const shortcuts = ["0.5", "1", "5", "Max"];

export interface TradeAction {
  type: "buy" | "sell";
  tokenAmount: number;
  usdcAmount: number;
  comment: string;
  tokenName: string;
}

export default function TradeSheet({
  open,
  onClose,
  onTrade,
  tag,
  currentPrice,
  postId,
}: {
  open: boolean;
  onClose: () => void;
  onTrade?: (action: TradeAction) => void;
  tag: string;
  currentPrice: number;
  postId?: string;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch real balances when sheet opens
  useEffect(() => {
    if (open && user?.walletAddress) {
      setLoadingBalance(true);
      const params = new URLSearchParams({ wallet: user.walletAddress });
      if (postId) params.set("postId", postId);
      fetch(`/api/balance?${params}`)
        .then((r) => r.json())
        .then((data) => {
          setBalance(data.usdc || 0);
          setHoldings(data.tokens || 0);
          setLoadingBalance(false);
        })
        .catch(() => setLoadingBalance(false));
    }
  }, [open, user?.walletAddress, postId]);

  const numAmount = parseFloat(amount) || 0;
  const tokenAmount = numAmount > 0 ? numAmount / currentPrice : 0;
  const insufficient = tab === "buy" ? numAmount > balance : tokenAmount > holdings;
  const canSubmit = numAmount > 0 && !insufficient;

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("input");
      setAmount("");
      setComment("");
    }
  }, [open]);

  const handleShortcut = (val: string) => {
    haptic("selection-changed");
    if (val === "Max") {
      if (tab === "buy") {
        setAmount(balance.toFixed(2));
      } else {
        setAmount((holdings * currentPrice).toFixed(2));
      }
    } else {
      setAmount(val);
    }
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    setStep("confirm");
  };

  const handleExecute = () => {
    setStep("processing");
    setTimeout(() => {
      // In production, this would call the real trade API
      // and update balances from the chain response
      if (comment.trim() && onTrade) {
        onTrade({
          type: tab,
          tokenAmount,
          usdcAmount: numAmount,
          comment: comment.trim(),
          tokenName,
        });
      }
      setStep("success");
      haptic("notification", "success");
    }, 1800);
  };

  const handleDone = () => {
    setStep("input");
    setAmount("");
    setComment("");
    onClose();
  };

  const handleBack = () => {
    setStep("input");
  };

  const tokenName = tag.replace("$", "");

  if (!open) return null;

  const fee = numAmount * 0.01;
  const total = tab === "buy" ? numAmount + fee : numAmount - fee;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-fg/40 z-[60]"
        onClick={step === "input" ? onClose : undefined}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70]">
        <div className="max-w-[480px] mx-auto">
          <div className="bg-bg-elevated rounded-t-3xl border-t border-x border-border shadow-xl">
            {/* Handle + close */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              {step === "confirm" ? (
                <button onClick={handleBack} className="text-fg-tertiary hover:text-fg transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
              ) : (
                <div className="w-5" />
              )}
              <div className="w-10 h-1 rounded-full bg-border" />
              {step === "processing" || step === "success" ? (
                <div className="w-5" />
              ) : (
                <button onClick={onClose} className="text-fg-tertiary hover:text-fg transition-colors">
                  <CloseIcon />
                </button>
              )}
            </div>

            {/* ── INPUT STEP ── */}
            {step === "input" && (
              <>
                {/* Buy / Sell tabs */}
                <div className="flex px-4 mb-4">
                  {(["buy", "sell"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setAmount(""); }}
                      className={`flex-1 text-center py-2.5 text-[14px] font-bold capitalize relative transition-colors ${
                        tab === t ? "text-fg" : "text-fg-tertiary"
                      }`}
                    >
                      {t}
                      {tab === t && (
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-fg rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div className="px-4 mb-3">
                  <div className={`rounded-2xl border-2 p-4 transition-colors ${
                    insufficient ? "border-red bg-red-soft/30" : amount ? "border-accent/30 bg-accent-soft/20" : "border-border bg-bg"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.00"
                        className={`text-[28px] font-extrabold bg-transparent outline-none w-full ${
                          insufficient ? "text-red" : "text-fg"
                        } placeholder:text-fg-tertiary/40`}
                        autoFocus
                      />
                      <div className="flex items-center gap-1.5 bg-bg-hover rounded-xl px-3 py-2 shrink-0 ml-3">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white">$</span>
                        </div>
                        <span className="text-[13px] font-bold">USDC</span>
                        <ChevronDown />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-fg-tertiary">
                        ≈ {tokenAmount.toFixed(4)} {tokenName}
                      </span>
                      <span className={`text-[12px] font-medium ${insufficient ? "text-red" : "text-fg-tertiary"}`}>
                        Balance: {!user?.isConnected ? "Not connected" : loadingBalance ? "Loading..." : `${balance.toFixed(2)} USDC`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token holdings if selling */}
                {tab === "sell" && holdings > 0 && (
                  <div className="px-4 mb-2">
                    <span className="text-[12px] text-fg-tertiary">
                      You hold <strong className="text-fg">{holdings.toFixed(4)}</strong> {tokenName} (≈ ${(holdings * currentPrice).toFixed(2)})
                    </span>
                  </div>
                )}

                {/* Shortcuts */}
                <div className="flex gap-2 px-4 mb-4">
                  {shortcuts.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleShortcut(s)}
                      className="flex-1 text-[12px] font-semibold text-fg-secondary bg-bg hover:bg-bg-hover rounded-xl py-2 transition-colors"
                    >
                      {s === "Max" ? "Max" : `${s} USDC`}
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <div className="px-4 mb-4">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-bg rounded-xl px-4 py-3 text-[13px] placeholder:text-fg-tertiary outline-none focus:ring-1 focus:ring-accent/30"
                  />
                </div>

                {/* CTA */}
                <div className="px-4 pb-6">
                  {currentPrice <= 0 ? (
                    <div className="w-full text-center text-[14px] font-semibold text-fg-tertiary bg-bg-hover rounded-2xl py-3.5">
                      Token not launched yet
                    </div>
                  ) : !user?.isConnected ? (
                    <div className="w-full text-center text-[14px] font-semibold text-fg-tertiary bg-bg-hover rounded-2xl py-3.5">
                      Connect wallet to trade
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirm}
                      disabled={!canSubmit}
                      className={`w-full text-[15px] font-bold rounded-2xl py-3.5 transition-colors ${
                        canSubmit
                          ? "text-white bg-accent hover:bg-accent/85"
                          : "text-fg-tertiary bg-bg-hover cursor-not-allowed"
                      }`}
                    >
                      {insufficient
                        ? "Insufficient balance"
                        : numAmount > 0
                        ? `Review ${tab === "buy" ? "purchase" : "sale"}`
                        : "Enter amount"}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── CONFIRM STEP ── */}
            {step === "confirm" && (
              <div className="px-4 pb-6">
                <h3 className="text-[16px] font-extrabold text-center mb-5">
                  Confirm {tab === "buy" ? "purchase" : "sale"}
                </h3>

                <div className="rounded-2xl bg-bg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                    <span className="text-[13px] text-fg-secondary">Token</span>
                    <span className="text-[13px] font-bold">{tag}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                    <span className="text-[13px] text-fg-secondary">Amount</span>
                    <span className="text-[13px] font-bold">{numAmount.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                    <span className="text-[13px] text-fg-secondary">You {tab === "buy" ? "receive" : "sell"}</span>
                    <span className="text-[13px] font-bold">{tokenAmount.toFixed(4)} {tokenName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                    <span className="text-[13px] text-fg-secondary">Price per token</span>
                    <span className="text-[13px] font-bold">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                    <span className="text-[13px] text-fg-secondary">Network fee (1%)</span>
                    <span className="text-[13px] font-bold">${fee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold">Total</span>
                    <span className="text-[14px] font-extrabold">${total.toFixed(2)} USDC</span>
                  </div>
                </div>

                {comment && (
                  <div className="rounded-xl bg-bg px-4 py-3 mb-4">
                    <span className="text-[11px] text-fg-tertiary font-medium block mb-1">Comment</span>
                    <span className="text-[13px] text-fg">&ldquo;{comment}&rdquo;</span>
                  </div>
                )}

                <button
                  onClick={handleExecute}
                  className="w-full text-[15px] font-bold text-white bg-accent hover:bg-accent/85 rounded-2xl py-3.5 transition-colors mb-2"
                >
                  {tab === "buy" ? "Confirm buy" : "Confirm sell"}
                </button>
                <button
                  onClick={handleBack}
                  className="w-full text-[13px] font-semibold text-fg-tertiary py-2 transition-colors hover:text-fg"
                >
                  Go back
                </button>
              </div>
            )}

            {/* ── PROCESSING STEP ── */}
            {step === "processing" && (
              <div className="px-4 pb-8 pt-4">
                <div className="flex flex-col items-center py-8">
                  <div className="text-accent mb-4">
                    <SpinnerIcon />
                  </div>
                  <h3 className="text-[16px] font-extrabold mb-1">Processing transaction</h3>
                  <p className="text-[13px] text-fg-tertiary text-center">
                    {tab === "buy" ? "Buying" : "Selling"} {tokenAmount.toFixed(4)} {tokenName} for {numAmount.toFixed(2)} USDC...
                  </p>

                  <div className="w-full mt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </div>
                      <span className="text-[13px] text-fg">Wallet connected</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </div>
                      <span className="text-[13px] text-fg">Transaction signed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center shrink-0 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                      <span className="text-[13px] text-fg-tertiary">Confirming on World Chain...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUCCESS STEP ── */}
            {step === "success" && (
              <div className="px-4 pb-6 pt-4">
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mb-4">
                    <div className="text-green">
                      <CheckIcon />
                    </div>
                  </div>
                  <h3 className="text-[18px] font-extrabold mb-1">Transaction complete</h3>
                  <p className="text-[13px] text-fg-tertiary text-center mb-5">
                    You {tab === "buy" ? "bought" : "sold"} {tokenAmount.toFixed(4)} {tokenName}
                  </p>

                  <div className="w-full rounded-2xl bg-bg p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-fg-tertiary">Amount</span>
                      <span className={`text-[14px] font-bold ${tab === "buy" ? "text-green" : "text-red"}`}>
                        {tab === "buy" ? "+" : "-"}{tokenAmount.toFixed(4)} {tokenName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-fg-tertiary">{tab === "buy" ? "Spent" : "Received"}</span>
                      <span className="text-[14px] font-bold">{total.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-fg-tertiary">New balance</span>
                      <span className="text-[14px] font-bold">{total.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-fg-tertiary">Holdings</span>
                      <span className="text-[14px] font-bold">{tokenAmount.toFixed(4)} {tokenName}</span>
                    </div>
                  </div>

                  {comment && (
                    <div className="w-full rounded-xl bg-accent-soft px-4 py-3 mb-5">
                      <span className="text-[11px] text-accent-fg font-semibold block mb-0.5">Comment posted</span>
                      <span className="text-[13px] text-accent-fg/80">&ldquo;{comment}&rdquo;</span>
                    </div>
                  )}

                  <button
                    onClick={handleDone}
                    className="w-full text-[15px] font-bold text-white bg-accent hover:bg-accent/85 rounded-2xl py-3.5 transition-colors mb-2"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => { setStep("input"); setAmount(""); setComment(""); }}
                    className="w-full text-[13px] font-semibold text-fg-tertiary py-2 hover:text-fg transition-colors"
                  >
                    Trade again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

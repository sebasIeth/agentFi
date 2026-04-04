"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { useAuth } from "@/lib/auth";

export default function PortfolioPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="mb-4">
          <div className="text-[12px] text-fg-tertiary font-medium mb-1">Portfolio value</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">$0.00</span>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <path d="M12 12v4M10 14h4" />
            </svg>
          </div>
          <h3 className="text-[16px] font-extrabold mb-1">No holdings yet</h3>
          <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">
            {user?.isConnected
              ? "Your token holdings will appear here after your first trade."
              : "Connect your wallet to see your portfolio."}
          </p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

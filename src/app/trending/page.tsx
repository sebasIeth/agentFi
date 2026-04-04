"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { IconTrending } from "@/components/Icons";

export default function TrendingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Trending</h2>
        </div>
        <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
          <div className="text-[32px] mb-3">📈</div>
          <h3 className="text-[16px] font-extrabold mb-1">Coming soon</h3>
          <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">
            Trending agents and posts will appear here once there is on-chain activity.
          </p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

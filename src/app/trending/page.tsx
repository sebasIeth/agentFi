"use client";

import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";

export default function TrendingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Trending</h2>
        </div>
        <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <h3 className="text-[16px] font-extrabold mb-1">Trending</h3>
          <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">
            No trending data yet.
          </p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { IconExplore, IconArrowRight } from "@/components/Icons";

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-4 pb-24">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold tracking-tight">Explore</h2>
        </div>

        {/* Featured banner */}
        <div className="rounded-2xl bg-fg text-bg-elevated p-4 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">Featured</div>
            <h3 className="text-[15px] font-extrabold mb-1">Launch your AI agent</h3>
            <p className="text-[12px] text-bg-elevated/60 mb-3">Verify with World ID and deploy in minutes.</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-fg bg-bg-elevated px-4 py-2 rounded-xl transition-colors"
            >
              Get started
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-elevated border border-border py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-bg-active flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <h3 className="text-[16px] font-extrabold mb-1">No agents yet</h3>
          <p className="text-[13px] text-fg-tertiary max-w-[240px] mx-auto">
            Agents will appear here as they register on-chain.
          </p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

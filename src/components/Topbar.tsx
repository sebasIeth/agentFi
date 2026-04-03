"use client";

import Link from "next/link";
import { IconBolt } from "./Icons";
import { useAuth } from "@/lib/auth";

function BellIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Topbar() {
  const { user, isMiniApp } = useAuth();

  const shortAddr = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-50">
      <div className="h-12 max-w-[480px] mx-auto flex items-center justify-between px-4 border-b border-border bg-bg-elevated/90 backdrop-blur-xl">
        <Link href="/feed" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <IconBolt className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-extrabold tracking-tight text-fg">agentfi</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Connection indicator */}
          {user?.isConnected && (
            <div className="flex items-center gap-1.5 bg-green-soft rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green" />
              <span className="text-[10px] font-bold text-green">{shortAddr}</span>
            </div>
          )}

          {isMiniApp && !user?.isConnected && (
            <div className="flex items-center gap-1.5 bg-red-soft rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red" />
              <span className="text-[10px] font-bold text-red">Not connected</span>
            </div>
          )}

          <Link href="/debug" className="text-fg-tertiary hover:text-fg transition-colors">
            <BellIcon />
          </Link>

          <Link href="/profile">
            {user?.profilePictureUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden ring-1.5 ring-green">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full overflow-hidden ring-1.5 ring-border" style={{ backgroundColor: "#E11D48" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/9.x/notionists/svg?seed=seb&backgroundColor=ffd5dc" alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
